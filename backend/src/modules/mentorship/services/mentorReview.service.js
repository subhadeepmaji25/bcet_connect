// backend/src/modules/mentorship/services/mentorReview.service.js
//
// Owns MentorReview lifecycle only — createReview + getMentorReviews.
// Deliberately does NOT touch MentorSession beyond a read-only ownership
// check, same separation as mentorRequest.service.js never touching
// Conversation internals (it only calls conversationService).
//
// After a review is saved, this file recalculates MentorProfile.rating
// and reviewCount by re-querying ALL reviews for that mentor (not an
// incremental running-average) — slightly more DB work per review, but
// immune to floating-point drift that an incremental average would
// accumulate over hundreds of reviews. Given review-writes are low
// frequency compared to reads, this tradeoff favors correctness.

const MentorReview = require("../models/MentorReview");
const MentorSession = require("../models/MentorSession");
const MentorProfile = require("../models/MentorProfile");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { SESSION_STATUS } = require("../constants/mentor.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const logger = require("../../../shared/logger/logger");

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

// Recomputes rating/reviewCount from the full review set for a mentor and
// persists it onto MentorProfile — called once right after a review is
// created. Wrapped in try/catch at the call site (not here) so a failure
// here never blocks the review itself from being returned to the caller.
const recalculateMentorRating = async (mentorId) => {
  const stats = await MentorReview.aggregate([
    { $match: { mentorId } },
    { $group: { _id: "$mentorId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await MentorProfile.updateOne(
    { userId: mentorId },
    { $set: { rating: Math.round(avgRating * 10) / 10, reviewCount: count } }
  );
};

const createReview = async (studentId, sessionId, payload) => {
  const { rating, feedback, anonymous } = payload;

  const session = await MentorSession.findOne({ _id: sessionId, studentId });
  if (!session) throw ApiError.notFound("Session not found");

  if (session.status !== SESSION_STATUS.COMPLETED) {
    throw ApiError.badRequest("You can only review a session after it has been completed");
  }

  // Database-level unique index on sessionId is the real guard against a
  // double-submit race; this findOne is a friendlier pre-check so a
  // duplicate attempt gets a clean 409 instead of a raw Mongo E11000 error.
  const existing = await MentorReview.findOne({ sessionId });
  if (existing) throw ApiError.conflict("You have already reviewed this session");

  const review = await MentorReview.create({
    sessionId,
    mentorId: session.mentorId,
    studentId,
    rating,
    feedback: feedback || "",
    anonymous: Boolean(anonymous)
  });

  try {
    await recalculateMentorRating(session.mentorId);
  } catch (err) {
    logger.error("Failed to recalculate mentor rating after review", {
      module: "Mentorship",
      mentorId: session.mentorId,
      sessionId,
      error: err.message
    });
  }

  const studentName = review.anonymous ? "A student" : await getUsernameSafe(studentId);
  await notify(NOTIFICATION_EVENTS.MENTOR_REVIEW_RECEIVED, {
    userId: session.mentorId,
    data: { studentName, rating },
    meta: { sessionId, reviewId: review._id }
  });

  return { success: true, message: "Review submitted successfully", data: { review } };
};

const getMentorReviews = async (mentorId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { mentorId };

  const [reviews, total] = await Promise.all([
    MentorReview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      // Anonymous reviews still need to render as "Anonymous" client-side
      // rather than leaking studentId — populate always runs, the
      // controller/frontend layer is responsible for masking the name
      // when review.anonymous === true. Kept out of the service layer
      // since redaction is a presentation concern, not a data concern.
      .populate({
        path: "studentId",
        select: "username email role profileId",
        populate: { path: "profileId", select: "fullName avatar branch department" }
      })
      .lean(),
    MentorReview.countDocuments(filter)
  ]);

  return { reviews, pagination: { total, page: Number(page), limit: Number(limit) } };
};

module.exports = {
  createReview,
  getMentorReviews
};