// backend/src/modules/communication/services/attachment.service.js
//
// NOTE on this update: no notify() call added here, and it shouldn't
// be. This file handles ONLY step 1 of the two-step chat-attachment
// flow — uploading a raw file to Cloudinary and returning metadata
// shaped for message.validator.js's attachmentSchema. It never creates
// a Message and never touches a Conversation. The actual notification
// (MESSAGE_RECEIVED) already fires from message.service.js's
// sendMessage() — which is step 2, the POST /messages call that
// references this attachment metadata. Adding a notify() call in THIS
// file would double-notify the recipient for every attachment message
// (once here, once in sendMessage), so it's deliberately left out.
//
// Handles ONLY step 1 of the two-step chat-attachment flow: take a raw
// uploaded file, push it to Cloudinary via the shared media layer, and
// hand back metadata shaped exactly like message.validator.js's
// attachmentSchema expects. Step 2 is the existing POST /messages route,
// which references this metadata — this file never creates a Message,
// never touches a Conversation, and never checks canCommunicate(). Same
// separation-of-concerns reasoning as avatar.service.js vs profile.service.js.

const { uploadMedia } = require("../../../shared/media/media.service");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const ApiError = require("../../../shared/errors/ApiError");
const { ATTACHMENT_TYPES, LIMITS } = require("../constants/communication.constants");

// Image and document share one Cloudinary media type (CHAT_ATTACHMENT),
// so the logical attachment `type` the Message model stores has to be
// derived from the real mimetype rather than trusted from the client.
const resolveImageOrDocumentType = (mimeType) =>
  (mimeType || "").startsWith("image/") ? ATTACHMENT_TYPES.IMAGE : ATTACHMENT_TYPES.DOCUMENT;

const buildAttachmentMetadata = (type, uploaded, file, durationSeconds) => {
  const attachment = {
    type,
    url: uploaded.url,
    publicId: uploaded.publicId,
    mimeType: file.mimetype,
    size: file.size,
    originalName: file.originalname || ""
  };

  // Duration is client-reported (server never probes the media file
  // itself) — only kept if it parses cleanly and stays under the ceiling.
  if (durationSeconds !== undefined && durationSeconds !== null && durationSeconds !== "") {
    const parsed = Number(durationSeconds);
    if (!Number.isNaN(parsed) && parsed > 0 && parsed <= LIMITS.MAX_ATTACHMENT_DURATION_SECONDS) {
      attachment.duration = Math.round(parsed);
    }
  }

  return { success: true, message: "File uploaded successfully", data: { attachment } };
};

const uploadChatFile = async (userId, file) => {
  if (!file || !file.buffer) throw ApiError.validation("A file is required");

  const attachmentType = resolveImageOrDocumentType(file.mimetype);
  const uploaded = await uploadMedia(MEDIA_TYPES.CHAT_ATTACHMENT, userId, {
    buffer: file.buffer,
    mimeType: file.mimetype,
    sizeInBytes: file.size,
    originalName: file.originalname
  });

  return buildAttachmentMetadata(attachmentType, uploaded, file);
};

const uploadChatVoiceNote = async (userId, file, durationSeconds) => {
  if (!file || !file.buffer) throw ApiError.validation("A voice note file is required");

  const uploaded = await uploadMedia(MEDIA_TYPES.CHAT_VOICE_NOTE, userId, {
    buffer: file.buffer,
    mimeType: file.mimetype,
    sizeInBytes: file.size,
    originalName: file.originalname
  });

  return buildAttachmentMetadata(ATTACHMENT_TYPES.VOICE_NOTE, uploaded, file, durationSeconds);
};

const uploadChatVideo = async (userId, file, durationSeconds) => {
  if (!file || !file.buffer) throw ApiError.validation("A video file is required");

  const uploaded = await uploadMedia(MEDIA_TYPES.CHAT_VIDEO, userId, {
    buffer: file.buffer,
    mimeType: file.mimetype,
    sizeInBytes: file.size,
    originalName: file.originalname
  });

  return buildAttachmentMetadata(ATTACHMENT_TYPES.VIDEO, uploaded, file, durationSeconds);
};

module.exports = { uploadChatFile, uploadChatVoiceNote, uploadChatVideo };