// backend/src/modules/events/services/eventAttendance.service.js
const jwt = require("jsonwebtoken");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const EventAttendance = require("../models/EventAttendance");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { EVENT_STATUS, REGISTRATION_STATUS } = require("../constants/event.constants");

// Deliberately reuses the same JWT_SECRET auth.middleware.js already
// requires at boot (see its startup check) rather than adding a second
// secret to manage — but with its own `purpose` claim and a short
// expiry, so a check-in QR token can never be replayed as a login token
// or vice versa. No new npm dependency needed: jsonwebtoken is already
// installed for auth; the actual QR *image* is rendered client-side from
// this token string (e.g. via a frontend QR component) — the backend
// only ever deals in the token, never a QR image.
const CHECKIN_TOKEN_PURPOSE = "event-checkin";
const CHECKIN_TOKEN_TTL = "6h"; // generous enough to cover a full-day fest without needing regeneration

const generateCheckInToken = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("status").lean();
  if (!event) throw ApiError.notFound("Event not found");
  if (![EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE].includes(event.status)) {
    throw ApiError.badRequest("Check-in codes are only available once an event is approved");
  }

  const registration = await EventRegistration.findOne({
    eventId,
    userId,
    status: REGISTRATION_STATUS.CONFIRMED
  }).lean();
  if (!registration) {
    throw ApiError.forbidden("Only confirmed registrants can generate a check-in code");
  }

  const token = jwt.sign(
    { eventId: String(eventId), userId: String(userId), purpose: CHECKIN_TOKEN_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: CHECKIN_TOKEN_TTL }
  );

  return { success: true, message: "Check-in code generated", data: { token, expiresIn: CHECKIN_TOKEN_TTL } };
};

// The actual write path, shared by both entry points below (token scan
// and manual roll-call) — same "one obvious trigger point" discipline
// promoteNextWaitlisted() already follows in eventRegistration.service.js.
const recordAttendance = async (eventId, userId, checkedInBy) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("title status").lean();
  if (!event) throw ApiError.notFound("Event not found");
  if (![EVENT_STATUS.LIVE, EVENT_STATUS.COMPLETED].includes(event.status)) {
    throw ApiError.badRequest("Attendance can only be marked once an event has gone live");
  }

  const registration = await EventRegistration.findOne({
    eventId,
    userId,
    status: REGISTRATION_STATUS.CONFIRMED
  }).lean();
  if (!registration) {
    throw ApiError.forbidden("This user does not have a confirmed registration for this event");
  }

  // findOneAndUpdate + upsert rather than create() so a double-scan of
  // the same QR (network retry, over-eager tap) is a harmless no-op
  // against the unique (eventId, userId) index instead of a 409.
  const attendance = await EventAttendance.findOneAndUpdate(
    { eventId, userId },
    { $setOnInsert: { checkedInAt: new Date(), checkedInBy } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await notify(NOTIFICATION_EVENTS.EVENT_ATTENDANCE_MARKED, {
    userId,
    data: { eventTitle: event.title },
    meta: { eventId }
  });

  return { success: true, message: "Attendance recorded", data: { attendance } };
};

// Entry point 1 — organizer/faculty scans the attendee's QR (the token
// from generateCheckInToken()). Verifies the token's purpose claim so a
// login/reset token can never be fed in here by mistake.
const checkInByToken = async (token, checkedInBy) => {
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw ApiError.badRequest("Check-in code is invalid or has expired");
  }
  if (decoded.purpose !== CHECKIN_TOKEN_PURPOSE) {
    throw ApiError.badRequest("This code is not a valid check-in code");
  }
  return recordAttendance(decoded.eventId, decoded.userId, checkedInBy);
};

// Entry point 2 — manual roll-call fallback for venues without reliable
// QR scanning (outdoor sports events, poor connectivity, etc.) — same
// organizer-only gate, just keyed by userId directly instead of a token.
const checkInManually = async (eventId, targetUserId, checkedInBy, checkedInByRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("organizedBy").lean();
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === checkedInBy.toString();
  if (!isOwner && checkedInByRole !== "admin") {
    throw ApiError.forbidden("Only the organizer or an admin can mark attendance for this event");
  }
  return recordAttendance(eventId, targetUserId, checkedInBy);
};

const getEventAttendance = async (eventId, userId, userRole, { page = 1, limit = 20 } = {}) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("organizedBy").lean();
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("Not authorized to view attendance for this event");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [attendance, total] = await Promise.all([
    EventAttendance.find({ eventId })
      .sort({ checkedInAt: 1 }).skip(skip).limit(Number(limit))
      .populate("userId", "username fullName email").lean(),
    EventAttendance.countDocuments({ eventId })
  ]);

  return { attendance, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getMyAttendance = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [attendance, total] = await Promise.all([
    EventAttendance.find({ userId })
      .sort({ checkedInAt: -1 }).skip(skip).limit(Number(limit))
      .populate("eventId", "title startTime endTime venue category").lean(),
    EventAttendance.countDocuments({ userId })
  ]);
  return { attendance, pagination: { total, page: Number(page), limit: Number(limit) } };
};

module.exports = {
  generateCheckInToken,
  checkInByToken,
  checkInManually,
  getEventAttendance,
  getMyAttendance
};