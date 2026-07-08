// backend/src/modules/communication/controllers/attachment.controller.js
//
// Step 1 of the two-step attachment flow. Never creates a Message or
// touches a Conversation — that happens afterward via the existing
// POST /conversations/:id/messages route, using the metadata returned here.

const attachmentService = require("../services/attachment.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const uploadChatFileController = asyncHandler(async (req, res) => {
  const result = await attachmentService.uploadChatFile(req.user.id, req.file);
  logger.info("Chat file attachment uploaded", { module: "Communication", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const uploadChatVoiceNoteController = asyncHandler(async (req, res) => {
  const result = await attachmentService.uploadChatVoiceNote(req.user.id, req.file, req.body.duration);
  logger.info("Chat voice note uploaded", { module: "Communication", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const uploadChatVideoController = asyncHandler(async (req, res) => {
  const result = await attachmentService.uploadChatVideo(req.user.id, req.file, req.body.duration);
  logger.info("Chat video uploaded", { module: "Communication", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

module.exports = {
  uploadChatFileController,
  uploadChatVoiceNoteController,
  uploadChatVideoController
};