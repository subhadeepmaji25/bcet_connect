// backend/src/modules/events/controllers/eventFeedback.controller.js
const feedbackService = require("../services/eventFeedback.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const submitFeedbackController = asyncHandler(async (req, res) => {
  const result = await feedbackService.submitFeedback(req.params.eventId, req.user.id, req.body);
  logger.info("Event feedback submitted", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getEventFeedbackController = asyncHandler(async (req, res) => {
  const result = await feedbackService.getEventFeedback(req.params.eventId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Event feedback fetched successfully",
    data: { feedback: result.feedback, summary: result.summary },
    meta: { pagination: result.pagination }
  });
});

const getMyFeedbackForEventController = asyncHandler(async (req, res) => {
  const result = await feedbackService.getMyFeedbackForEvent(req.params.eventId, req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  submitFeedbackController,
  getEventFeedbackController,
  getMyFeedbackForEventController
};