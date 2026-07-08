// backend/src/modules/communication/controllers/conversation.controller.js
const conversationService = require("../services/conversation.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const startConversationController = asyncHandler(async (req, res) => {
  const result = await conversationService.startConversation(req.user.id, req.body.recipientId);
  logger.info("Conversation started", { module: "Communication", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getMyConversationsController = asyncHandler(async (req, res) => {
  const result = await conversationService.getMyConversations(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Conversations fetched successfully",
    data: { conversations: result.conversations },
    meta: { pagination: result.pagination }
  });
});

const getConversationByIdController = asyncHandler(async (req, res) => {
  const result = await conversationService.getConversationById(req.params.conversationId, req.user.id);
  return sendResponse(res, result);
});

const archiveConversationController = asyncHandler(async (req, res) => {
  const result = await conversationService.archiveConversation(req.params.conversationId, req.user.id);
  logger.info("Conversation archived", { module: "Communication", userId: req.user.id });
  return sendResponse(res, result);
});

const unarchiveConversationController = asyncHandler(async (req, res) => {
  const result = await conversationService.unarchiveConversation(req.params.conversationId, req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  startConversationController,
  getMyConversationsController,
  getConversationByIdController,
  archiveConversationController,
  unarchiveConversationController
};