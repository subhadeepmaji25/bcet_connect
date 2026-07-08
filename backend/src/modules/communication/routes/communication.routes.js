// backend/src/modules/communication/routes/communication.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { createUploadMiddleware } = require("../../../shared/middlewares/upload.middleware");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const { messageLimiter, uploadLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateStartConversation,
  validateArchiveConversation,
  validateUnarchiveConversation
} = require("../validators/conversation.validator");

const {
  validateSendMessage,
  validateEditMessage,
  validateDeleteMessage,
  validateMarkAsRead
} = require("../validators/message.validator");

const {
  startConversationController,
  getMyConversationsController,
  getConversationByIdController,
  archiveConversationController,
  unarchiveConversationController
} = require("../controllers/conversation.controller");

const {
  sendMessageController,
  getMessagesController,
  editMessageController,
  deleteMessageController,
  markAsReadController
} = require("../controllers/message.controller");
const {
  uploadChatFileController,
  uploadChatVoiceNoteController,
  uploadChatVideoController
} = require("../controllers/attachment.controller");

// FIX: messageLimiter added — starting a conversation was the one
// write-heavy POST in this module with no rate limiter at all (messages
// and all 3 attachment uploads already had one). Reusing messageLimiter
// rather than adding a new limiter, since conversation-creation is lower
// volume than messages themselves and doesn't need a stricter ceiling.
router.post("/conversations", authMiddleware, messageLimiter, validateStartConversation, startConversationController);
router.get("/conversations", authMiddleware, getMyConversationsController);
router.get("/conversations/:conversationId", authMiddleware, getConversationByIdController);
router.patch("/conversations/:conversationId/archive", authMiddleware, validateArchiveConversation, archiveConversationController);
router.patch("/conversations/:conversationId/unarchive", authMiddleware, validateUnarchiveConversation, unarchiveConversationController);

const chatFileUpload = createUploadMiddleware(MEDIA_TYPES.CHAT_ATTACHMENT, { storage: "memory", fieldName: "file" });
const chatVoiceUpload = createUploadMiddleware(MEDIA_TYPES.CHAT_VOICE_NOTE, { storage: "memory", fieldName: "voice" });
const chatVideoUpload = createUploadMiddleware(MEDIA_TYPES.CHAT_VIDEO, { storage: "memory", fieldName: "video" });

router.post("/attachments/file", authMiddleware, uploadLimiter, chatFileUpload, uploadChatFileController);
router.post("/attachments/voice", authMiddleware, uploadLimiter, chatVoiceUpload, uploadChatVoiceNoteController);
router.post("/attachments/video", authMiddleware, uploadLimiter, chatVideoUpload, uploadChatVideoController);
router.post(
  "/conversations/:conversationId/messages",
  authMiddleware,
  messageLimiter,
  validateSendMessage,
  sendMessageController
);
router.get("/conversations/:conversationId/messages", authMiddleware, getMessagesController);
router.patch("/conversations/:conversationId/read", authMiddleware, validateMarkAsRead, markAsReadController);

router.patch("/messages/:messageId", authMiddleware, validateEditMessage, editMessageController);
router.delete("/messages/:messageId", authMiddleware, validateDeleteMessage, deleteMessageController);

module.exports = router;