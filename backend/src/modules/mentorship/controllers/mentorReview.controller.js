// backend/src/modules/mentorship/controllers/mentorReview.controller.js
const mentorReviewService = require("../services/mentorReview.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createReviewController = asyncHandler(async (req, res) => {
  const result = await mentorReviewService.createReview(req.user.id, req.params.sessionId, req.body);
  logger.info("Mentorship review submitted", { module: "Mentorship", studentId: req.user.id, sessionId: req.params.sessionId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getMentorReviewsController = asyncHandler(async (req, res) => {
  const result = await mentorReviewService.getMentorReviews(req.params.mentorId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Mentor reviews fetched",
    data: { reviews: result.reviews },
    meta: { pagination: result.pagination }
  });
});

module.exports = { createReviewController, getMentorReviewsController };