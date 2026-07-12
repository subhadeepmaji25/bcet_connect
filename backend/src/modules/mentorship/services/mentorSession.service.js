// backend/src/modules/mentorship/services/mentorSession.service.js
//
// UPDATED: added computePhase() (real-time upcoming/live/ended
// classification attached to every session response), and two cron-only
// functions — markSessionsLive() and autoCompleteSessions() — that
// scheduleMentorSessionCron.js calls every minute. autoCompleteSessions()
// deliberately reuses completeSession() rather than duplicating its
// logic, so a session completed by the cron and one completed manually
// by the mentor go through the exact same totalSessions-increment +
// notify() path — no drift between the two triggers.

const MentorSession = require("../models/MentorSession");
const MentorRequest = require("../models/MentorRequest");
const MentorProfile = require("../models/MentorProfile");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { SESSION_STATUS, REQUEST_STATUS, MEETING_MODES } = require("../constants/mentor.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const logger = require("../../../shared/logger/logger");

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const formatSessionLabel = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

const isActiveStatus = (status) => status === SESSION_STATUS.SCHEDULED || status === SESSION_STATUS.LIVE;

// NEW: real-time phase computation. Never persisted — computed fresh on
// every read from `status` + `scheduledAt`/`endsAt` compared against
// `Date.now()`. Works identically whether `session` is a lean plain
// object (from getMySessions) or a full Mongoose document (from
// getSessionById), since it only reads fields, never calls document
// methods.
const computePhase = (session) => {
  const now = new Date();

  if (session.status === SESSION_STATUS.CANCELLED) return { phase: "cancelled" };
  if (session.status === SESSION_STATUS.COMPLETED) return { phase: "ended" };
  if (session.status === SESSION_STATUS.NO_SHOW) return { phase: "no_show" };

  const endsAt = session.endsAt
    ? new Date(session.endsAt)
    : new Date(new Date(session.scheduledAt).getTime() + session.duration * 60000);
  const scheduledAt = new Date(session.scheduledAt);

  if (now < scheduledAt) {
    return { phase: "upcoming", secondsUntilStart: Math.max(0, Math.floor((scheduledAt - now) / 1000)) };
  }
  if (now >= scheduledAt && now < endsAt) {
    return { phase: "live", secondsRemaining: Math.max(0, Math.floor((endsAt - now) / 1000)) };
  }
  // Status still says scheduled/live but the time window has already
  // passed — the cron hasn't ticked yet (runs once a minute, so there's
  // up to a ~60s window where this is possible). Frontend should treat
  // this the same as "ended" for UI purposes (stop showing countdown,
  // stop allowing send) without waiting for the cron to catch up.
  return { phase: "awaiting_completion" };
};

const scheduleSession = async (mentorUserId, payload) => {
  const { requestId, scheduledAt, duration, mode, meetingLink, notes } = payload;

  const request = await MentorRequest.findOne({ _id: requestId, mentorId: mentorUserId });
  if (!request) throw ApiError.notFound("Mentorship request not found");
  if (request.status !== REQUEST_STATUS.ACCEPTED) {
    throw ApiError.badRequest("A session can only be scheduled for an accepted mentorship request");
  }

  if (mode === MEETING_MODES[0] && !meetingLink) {
    throw ApiError.badRequest("A meeting link is required for online sessions");
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    throw ApiError.badRequest("scheduledAt must be a valid future date/time");
  }

  const effectiveDuration = duration || DEFAULT_SESSION_DURATION_FALLBACK(duration);
  // NEW: endsAt computed once, here, and stored — see model comment for why.
  const endsAt = new Date(scheduledDate.getTime() + effectiveDuration * 60000);

  const session = await MentorSession.create({
    requestId: request._id,
    conversationId: request.conversationId || null,
    mentorId: mentorUserId,
    studentId: request.studentId,
    topic: request.topic,
    scheduledAt: scheduledDate,
    endsAt, // NEW
    duration: effectiveDuration,
    mode,
    meetingLink: meetingLink || "",
    notes: notes || "",
    status: SESSION_STATUS.SCHEDULED
  });

  await notify(NOTIFICATION_EVENTS.MENTOR_SESSION_SCHEDULED, {
    userId: request.studentId,
    data: { topic: request.topic, scheduledAtLabel: formatSessionLabel(scheduledDate) },
    meta: { sessionId: session._id, requestId: request._id, conversationId: request.conversationId || null }
  });

  return { success: true, message: "Session scheduled successfully", data: { session, ...computePhase(session) } };
};

// Small helper so a falsy/undefined duration from validation still
// resolves to a real number before the *60000 math runs — validator
// already enforces this via SESSION_DURATIONS enum, this is just a
// defensive fallback so scheduleSession never saves endsAt as NaN.
const DEFAULT_SESSION_DURATION_FALLBACK = (duration) => duration || 30;

const completeSession = async (mentorUserId, sessionId) => {
  const session = await MentorSession.findOne({ _id: sessionId, mentorId: mentorUserId });
  if (!session) throw ApiError.notFound("Session not found");
  if (!isActiveStatus(session.status)) throw ApiError.badRequest(`Session is already ${session.status}`);

  session.status = SESSION_STATUS.COMPLETED;
  session.completedAt = new Date();
  session.endedAt = session.endedAt || session.completedAt;
  await session.save();

  await MentorProfile.updateOne({ userId: mentorUserId }, { $inc: { totalSessions: 1 } }).catch((err) => {
    logger.error("Failed to increment totalSessions after session completion", {
      module: "Mentorship",
      mentorId: mentorUserId,
      sessionId,
      error: err.message
    });
  });

  const mentorName = await getUsernameSafe(mentorUserId);
  await notify(NOTIFICATION_EVENTS.MENTOR_SESSION_COMPLETED, {
    userId: session.studentId,
    data: { mentorName },
    meta: { sessionId: session._id, requestId: session.requestId, conversationId: session.conversationId || null }
  });

  return { success: true, message: "Session marked as completed", data: { session, reviewUnlocked: true } };
};

const cancelSession = async (userId, sessionId, reason = "") => {
  const session = await MentorSession.findOne({
    _id: sessionId,
    $or: [{ mentorId: userId }, { studentId: userId }]
  });
  if (!session) throw ApiError.notFound("Session not found");
  if (!isActiveStatus(session.status)) throw ApiError.badRequest(`Cannot cancel a session that is already ${session.status}`);

  session.status = SESSION_STATUS.CANCELLED;
  session.cancelledAt = new Date();
  session.cancelledBy = userId;
  session.cancelReason = reason;
  await session.save();

  return { success: true, message: "Session cancelled", data: { session } };
};

const getMySessions = async (userId, role, { page = 1, limit = 10, status } = {}) => {
  const filter = role === "mentor" ? { mentorId: userId } : { studentId: userId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [sessions, total] = await Promise.all([
    MentorSession.find(filter)
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "mentorId",
        select: "username email role profileId",
        populate: { path: "profileId", select: "fullName avatar currentCompany designation headline location" }
      })
      .populate({
        path: "studentId",
        select: "username email role profileId",
        populate: { path: "profileId", select: "fullName avatar branch department" }
      })
      .lean(),
    MentorSession.countDocuments(filter)
  ]);

  // NEW: phase attached to every session in the list — .lean() returns
  // plain objects, so this is a simple spread, no document-method loss.
  const sessionsWithPhase = sessions.map((s) => ({ ...s, ...computePhase(s) }));

  return { sessions: sessionsWithPhase, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getSessionById = async (sessionId, requesterId) => {
  const session = await MentorSession.findById(sessionId)
    .populate({
      path: "mentorId",
      select: "username email role profileId",
      populate: { path: "profileId", select: "fullName avatar currentCompany designation headline location" }
    })
    .populate({
      path: "studentId",
      select: "username email role profileId",
      populate: { path: "profileId", select: "fullName avatar branch department" }
    });
  if (!session) throw ApiError.notFound("Session not found");

  const isMentor = session.mentorId._id.toString() === requesterId.toString();
  const isStudent = session.studentId._id.toString() === requesterId.toString();
  if (!isMentor && !isStudent) throw ApiError.forbidden("You are not part of this mentorship session");

  // NEW: phase attached to the single-session response too.
  return { success: true, message: "Session fetched", data: { session, ...computePhase(session) } };
};

// NEW — cron-only. Flips scheduled → live for sessions whose window has
// started but not yet ended. Deliberately does NOT call notify() —
// per project convention, notifications are for events a user needs to
// act on or be told about; "your session's status field changed from
// scheduled to live" isn't new information to the student (they already
// got SESSION_SCHEDULED earlier and can see the live countdown in the
// app), so firing a second notification here would just be noise.
const markSessionsLive = async () => {
  const now = new Date();
  const result = await MentorSession.updateMany(
    { status: SESSION_STATUS.SCHEDULED, scheduledAt: { $lte: now }, endsAt: { $gt: now } },
    { $set: { status: SESSION_STATUS.LIVE, startedAt: now } }
  );
  return result.modifiedCount;
};

// NEW — cron-only. Finds every session whose time window has fully
// passed but is still sitting in scheduled/live (i.e. the mentor never
// manually completed it), and completes each one through the exact same
// completeSession() function a manual complete would use. Runs
// sequentially (not Promise.all) so one failing session's error doesn't
// abort the batch — each session gets its own try/catch and the loop
// continues regardless.
const autoCompleteSessions = async () => {
  const now = new Date();
  const dueSessions = await MentorSession.find({
    status: { $in: [SESSION_STATUS.SCHEDULED, SESSION_STATUS.LIVE] },
    endsAt: { $lte: now }
  }).select("_id mentorId");

  let completedCount = 0;
  for (const s of dueSessions) {
    try {
      await completeSession(s.mentorId, s._id);
      completedCount++;
    } catch (err) {
      logger.error("Auto-complete failed for session", {
        module: "Mentorship",
        sessionId: s._id,
        error: err.message
      });
    }
  }
  return completedCount;
};

module.exports = {
  scheduleSession,
  completeSession,
  cancelSession,
  getMySessions,
  getSessionById,
  markSessionsLive,      // NEW
  autoCompleteSessions   // NEW
};
