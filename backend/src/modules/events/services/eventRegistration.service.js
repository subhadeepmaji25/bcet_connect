// backend/src/modules/events/services/eventRegistration.service.js
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { EVENT_STATUS, REGISTRATION_STATUS } = require("../constants/event.constants");

const registerForEvent = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");

  if (!event.isRegistrationOpen) {
    throw ApiError.badRequest("Registration is not open for this event");
  }

  // Re-registration after a cancellation reuses the same document
  // (unique eventId+userId index) instead of creating a duplicate row —
  // this is why upsert-style findOneAndUpdate is used rather than a
  // plain create(), matching the unique-index comment on the model.
  const existing = await EventRegistration.findOne({ eventId, userId });
  if (existing && existing.status !== REGISTRATION_STATUS.CANCELLED) {
    throw ApiError.conflict("You are already registered for this event");
  }

  const isFull = event.capacity !== null && event.registrationCount >= event.capacity;
  const nextStatus = isFull ? REGISTRATION_STATUS.WAITLISTED : REGISTRATION_STATUS.CONFIRMED;

  let registration;
  if (existing) {
    existing.status = nextStatus;
    existing.registeredAt = new Date();
    existing.cancelledAt = null;
    registration = await existing.save();
  } else {
    registration = await EventRegistration.create({ eventId, userId, status: nextStatus });
  }

  await Event.updateOne(
    { _id: eventId },
    isFull ? { $inc: { waitlistCount: 1 } } : { $inc: { registrationCount: 1 } }
  );

  await notify(
    nextStatus === REGISTRATION_STATUS.CONFIRMED
      ? NOTIFICATION_EVENTS.EVENT_REGISTRATION_CONFIRMED
      : NOTIFICATION_EVENTS.EVENT_REGISTRATION_WAITLISTED,
    {
      userId,
      data: { eventTitle: event.title },
      meta: { eventId: event._id }
    }
  );

  return {
    success: true,
    message: nextStatus === REGISTRATION_STATUS.CONFIRMED
      ? "Registered successfully"
      : "Event is full — you have been added to the waitlist",
    data: { registration }
  };
};

const cancelRegistration = async (eventId, userId) => {
  const registration = await EventRegistration.findOne({ eventId, userId });
  if (!registration) throw ApiError.notFound("Registration not found");
  if (registration.status === REGISTRATION_STATUS.CANCELLED) {
    throw ApiError.badRequest("Registration is already cancelled");
  }

  const wasConfirmed = registration.status === REGISTRATION_STATUS.CONFIRMED;
  registration.status = REGISTRATION_STATUS.CANCELLED;
  registration.cancelledAt = new Date();
  await registration.save();

  await Event.updateOne(
    { _id: eventId },
    wasConfirmed ? { $inc: { registrationCount: -1 } } : { $inc: { waitlistCount: -1 } }
  );

  // Promote the earliest waitlisted registrant only when a CONFIRMED
  // seat actually just opened up — cancelling a waitlisted registration
  // doesn't free a seat, so no promotion should happen in that branch.
  if (wasConfirmed) {
    await promoteNextWaitlisted(eventId);
  }

  return { success: true, message: "Registration cancelled successfully", data: null };
};

// Not exported on its own — only ever called right after a confirmed
// seat frees up, same "one obvious trigger point" discipline Jobs uses
// for expireJob() (called only from getJobById and the cron, never
// exposed as a standalone route).
const promoteNextWaitlisted = async (eventId) => {
  const next = await EventRegistration.findOne({ eventId, status: REGISTRATION_STATUS.WAITLISTED })
    .sort({ registeredAt: 1 });
  if (!next) return;

  next.status = REGISTRATION_STATUS.CONFIRMED;
  await next.save();

  await Event.updateOne(
    { _id: eventId },
    { $inc: { registrationCount: 1, waitlistCount: -1 } }
  );

  const event = await Event.findById(eventId).select("title").lean();
  await notify(NOTIFICATION_EVENTS.EVENT_REGISTRATION_CONFIRMED, {
    userId: next.userId,
    data: { eventTitle: event?.title || "the event" },
    meta: { eventId }
  });
};

const getMyRegistrations = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [registrations, total] = await Promise.all([
    EventRegistration.find({ userId })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("eventId", "title startTime endTime venue status")
      .lean(),
    EventRegistration.countDocuments({ userId })
  ]);
  return { registrations, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getEventRegistrations = async (eventId, userId, userRole, { status, page = 1, limit = 20 } = {}) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("organizedBy").lean();
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("Not authorized to view registrations for this event");
  }

  const query = { eventId };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [registrations, total] = await Promise.all([
    EventRegistration.find(query)
      .sort({ registeredAt: 1 }).skip(skip).limit(Number(limit))
      .populate("userId", "username email role").lean(),
    EventRegistration.countDocuments(query)
  ]);
  return { registrations, pagination: { total, page: Number(page), limit: Number(limit) } };
};

module.exports = {
  registerForEvent,
  cancelRegistration,
  getMyRegistrations,
  getEventRegistrations
};
