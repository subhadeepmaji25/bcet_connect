// backend/src/modules/events/services/eventFeedback.service.js
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const EventFeedback = require("../models/EventFeedback");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { EVENT_STATUS, REGISTRATION_STATUS } = require("../constants/event.constants");

// Feedback is only meaningful after the event actually happened, and only
// from someone who was actually registered — same "was this user really
// part of this" gate registerForEvent()/cancelRegistration() already
// enforce via the unique (eventId, userId) index, just checked the other
// direction here.
const assertCanLeaveFeedback = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("status title").lean();
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== EVENT_STATUS.COMPLETED) {
    throw ApiError.badRequest("Feedback can only be submitted after the event has been completed");
  }

  const registration = await EventRegistration.findOne({
    eventId,
    userId,
    status: { $in: [REGISTRATION_STATUS.CONFIRMED, REGISTRATION_STATUS.CANCELLED] }
  }).lean();
  if (!registration) {
    throw ApiError.forbidden("Only registered attendees can leave feedback for this event");
  }

  return event;
};

// Upsert, not create — same reasoning EventRegistration's unique index
// comment gives for reusing one document instead of creating a second
// row: a user editing their rating after the fact should update the
// existing feedback, not accumulate duplicate entries the unique
// (eventId, userId) index would reject anyway.
const submitFeedback = async (eventId, userId, { rating, review }) => {
  const event = await assertCanLeaveFeedback(eventId, userId);

  const feedback = await EventFeedback.findOneAndUpdate(
    { eventId, userId },
    { $set: { rating, review: review || "" } },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );

  // Notify the organizer, not the reviewer — same "notify the person who
  // needs to act on this" pattern EVENT_CANCELLED already follows.
  // Fire-and-forget: notify() never throws (see notification.listener.js),
  // so a notification failure can't fail the feedback submission itself.
  const organizer = await Event.findById(eventId).select("organizedBy").lean();
  if (organizer) {
    await notify(NOTIFICATION_EVENTS.EVENT_FEEDBACK_RECEIVED, {
      userId: organizer.organizedBy,
      data: { eventTitle: event.title, rating, reviewerName: "A participant" },
      meta: { eventId }
    });
  }

  return { success: true, message: "Feedback submitted successfully", data: { feedback } };
};

const getEventFeedback = async (eventId, { page = 1, limit = 20 } = {}) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("_id").lean();
  if (!event) throw ApiError.notFound("Event not found");

  const skip = (Number(page) - 1) * Number(limit);
  const [feedback, total, ratingAgg] = await Promise.all([
    EventFeedback.find({ eventId })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("userId", "username fullName").lean(),
    EventFeedback.countDocuments({ eventId }),
    EventFeedback.aggregate([
      { $match: { eventId: event._id } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])
  ]);

  return {
    feedback,
    pagination: { total, page: Number(page), limit: Number(limit) },
    summary: {
      averageRating: ratingAgg[0] ? Number(ratingAgg[0].avgRating.toFixed(2)) : null,
      totalReviews: ratingAgg[0]?.count || 0
    }
  };
};

const getMyFeedbackForEvent = async (eventId, userId) => {
  const feedback = await EventFeedback.findOne({ eventId, userId }).lean();
  return { success: true, message: "Feedback fetched", data: { feedback } };
};

module.exports = {
  submitFeedback,
  getEventFeedback,
  getMyFeedbackForEvent
};