// backend/src/modules/mentorship/services/mentorSession.service.js
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

const isActiveStatus = (status) => status === SESSION_STATUS.SCHEDULED;

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

  const session = await MentorSession.create({
    requestId: request._id,
    conversationId: request.conversationId || null,
    mentorId: mentorUserId,
    studentId: request.studentId,
    topic: request.topic,
    scheduledAt: scheduledDate,
    duration,
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

  return { success: true, message: "Session scheduled successfully", data: { session } };
};

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

  return { sessions, pagination: { total, page: Number(page), limit: Number(limit) } };
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

  return { success: true, message: "Session fetched", data: { session } };
};

module.exports = {
  scheduleSession,
  completeSession,
  cancelSession,
  getMySessions,
  getSessionById
};