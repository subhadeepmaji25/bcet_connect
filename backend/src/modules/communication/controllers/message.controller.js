// backend/src/modules/communication/controllers/message.controller.js
const messageService = require("../services/message.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const sendMessageController = asyncHandler(async (req, res) => {
  const result = await messageService.sendMessage(req.params.conversationId, req.user.id, req.body);
  logger.info("Message sent", { module: "Communication", senderId: req.user.id, conversationId: req.params.conversationId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getMessagesController = asyncHandler(async (req, res) => {
  const result = await messageService.getMessages(req.params.conversationId, req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Messages fetched successfully",
    data: { messages: result.messages },
    meta: { pagination: result.pagination }
  });
});

const editMessageController = asyncHandler(async (req, res) => {
  const result = await messageService.editMessage(req.params.messageId, req.user.id, req.body.text);
  return sendResponse(res, result);
});

const deleteMessageController = asyncHandler(async (req, res) => {
  const result = await messageService.deleteMessage(req.params.messageId, req.user.id);
  logger.info("Message deleted", { module: "Communication", userId: req.user.id, messageId: req.params.messageId });
  return sendResponse(res, result);
});

const markAsReadController = asyncHandler(async (req, res) => {
  const result = await messageService.markAsRead(req.params.conversationId, req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  sendMessageController,
  getMessagesController,
  editMessageController,
  deleteMessageController,
  markAsReadController
};