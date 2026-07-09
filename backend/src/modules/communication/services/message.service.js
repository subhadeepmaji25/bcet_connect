// backend/src/modules/communication/services/message.service.js
//
// Owns Message lifecycle only. Historically this file never imported
// Mentorship, Connections, or canCommunicate() — because a Conversation's
// existence WAS proof enough that permission was granted.
//
// UPDATED — that's no longer sufficient for mentorship conversations.
// A mentorship Conversation exists permanently once created, but is only
// meant to be SENDABLE during an active session's live time-window — a
// TEMPORAL constraint that changes on its own without any user action,
// unlike a relationship-permission check. So sendMessage() now makes one
// narrow exception: it asks the engine layer's
// isMentorshipConversationCurrentlySendable() (a time-window check, NOT
// a business-rule/relationship check) before creating the message.
// getMessages()/markAsRead()/editMessage()/deleteMessage() are
// deliberately NOT gated — history stays fully readable forever, only
// new sends are blocked outside a live session window. This matches the
// project requirement: "session end ho then mentor ko koi message nahi
// jayega, slot time ke baad messages/attachments save rahenge sirf
// (history), chatting band."
//
// FIX (unchanged from before): deleteMessage() now re-syncs
// Conversation.lastMessageText when the deleted message was the
// conversation's latest one.
//
// notify() integration on sendMessage() → MESSAGE_RECEIVED, sent
// to the OTHER participant, never the sender. Recipient is resolved
// from conversation.participants by excluding senderId — works for any
// 2-participant conversation type (DIRECT or MENTORSHIP) without
// needing to know which one it is.

const Message = require("../models/Message");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const conversationService = require("./conversation.service");
const { MESSAGE_TYPES, ATTACHMENT_TYPES } = require("../constants/communication.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { isMentorshipConversationCurrentlySendable } = require("../../../engines/communication-access"); // NEW

// UPGRADED: now distinguishes voice_note/video instead of collapsing
// everything non-image into DOCUMENT. Mixed-type attachment arrays
// (rare, since the validator now forbids mixing heavy media with
// anything else) still fall back to DOCUMENT as a safe default.
const inferMessageType = (attachments = []) => {
  if (!attachments.length) return MESSAGE_TYPES.TEXT;

  const distinctTypes = new Set(attachments.map((a) => a.type));
  if (distinctTypes.size === 1) {
    const onlyType = [...distinctTypes][0];
    if (onlyType === ATTACHMENT_TYPES.IMAGE) return MESSAGE_TYPES.IMAGE;
    if (onlyType === ATTACHMENT_TYPES.VOICE_NOTE) return MESSAGE_TYPES.VOICE_NOTE;
    if (onlyType === ATTACHMENT_TYPES.VIDEO) return MESSAGE_TYPES.VIDEO;
  }
  return MESSAGE_TYPES.DOCUMENT;
};

// UPGRADED: preview text now names the media kind instead of the
// generic "Sent an attachment" — small UX win for the inbox list.
const buildPreviewText = (text, attachments = []) => {
  if (text) return text.slice(0, 120);
  if (!attachments.length) return "";

  if (attachments.length === 1) {
    const only = attachments[0].type;
    if (only === ATTACHMENT_TYPES.VOICE_NOTE) return "Sent a voice note";
    if (only === ATTACHMENT_TYPES.VIDEO) return "Sent a video";
    if (only === ATTACHMENT_TYPES.IMAGE) return "Sent a photo";
    return "Sent an attachment";
  }
  return "Sent " + attachments.length + " attachments";
};

// Small helper mirroring the same safe-lookup pattern used in
// connections/mentorship services — a name-lookup failure must never
// block a message from sending.
const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const sendMessage = async (conversationId, senderId, payload) => {
  const conversation = await conversationService.assertParticipant(conversationId, senderId);

  // NEW: mentorship conversations are only sendable during an active
  // session's live window. Returns true unconditionally for non-mentorship
  // conversation types (direct, community), so this is a no-op for them.
  const sendable = await isMentorshipConversationCurrentlySendable(conversation);
  if (!sendable) {
    throw ApiError.forbidden("Messaging is only available during an active mentorship session.");
  }

  if (payload.replyTo) {
    const original = await Message.findOne({ _id: payload.replyTo, conversationId, isDeleted: false });
    if (!original) throw ApiError.badRequest("The message you are replying to does not exist");
  }

  const message = await Message.create({
    conversationId,
    senderId,
    text: payload.text || "",
    attachments: payload.attachments || [],
    messageType: inferMessageType(payload.attachments),
    replyTo: payload.replyTo || null,
    readBy: [senderId] // sender has implicitly "read" their own message
  });

  await conversationService.touchLastMessage(
    conversation._id,
    senderId,
    buildPreviewText(payload.text, payload.attachments)
  );

  // Notify the OTHER participant only — never the sender. Works for
  // any 2-participant conversation (DIRECT or MENTORSHIP) since it just
  // excludes senderId from the participants array rather than assuming
  // a fixed pair of field names.
  const senderIdStr = senderId.toString();
  const recipientId = (conversation.participants || [])
    .map((participantId) => participantId.toString())
    .find((participantId) => participantId !== senderIdStr);

  if (recipientId) {
    const senderName = await getUsernameSafe(senderId);
    await notify(NOTIFICATION_EVENTS.MESSAGE_RECEIVED, {
      userId: recipientId,
      data: { senderName },
      meta: { conversationId: conversation._id, messageId: message._id }
    });
  }

  return { success: true, message: "Message sent", data: { message } };
};

// UNCHANGED — history stays fully readable regardless of session window.
const getMessages = async (conversationId, userId, { page = 1, limit = 30 } = {}) => {
  await conversationService.assertParticipant(conversationId, userId);

  const skip = (Number(page) - 1) * Number(limit);
  const filter = { conversationId, isDeleted: false };

  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("senderId", "username email role")
      .lean(),
    Message.countDocuments(filter)
  ]);

  return { messages, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const editMessage = async (messageId, userId, text) => {
  const message = await Message.findOne({ _id: messageId, senderId: userId, isDeleted: false });
  if (!message) throw ApiError.notFound("Message not found");

  message.text = text;
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  const latestMessage = await Message.findOne({ conversationId: message.conversationId, isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();

  if (latestMessage && latestMessage._id.toString() === message._id.toString()) {
    await conversationService.touchLastMessage(
      message.conversationId,
      message.senderId,
      buildPreviewText(message.text, message.attachments)
    );
  }

  return { success: true, message: "Message updated", data: { message } };
};

// FIX: previously deleted the message but never told conversation.service
// about it. If the deleted message was the conversation's LAST message,
// Conversation.lastMessageText kept showing the now-deleted (blanked)
// text forever — the inbox list would display stale content that no
// longer exists in the thread.
//
// Only re-touches the conversation when the deleted message actually
// WAS the latest one — deleting an older message in the middle of a
// thread has no effect on the preview, so this avoids a wasted query
// on the common case. After confirming it was the latest, it looks up
// the new latest NON-deleted message and reuses buildPreviewText() so
// the preview logic (voice note / video / photo / attachment count)
// stays identical to what sendMessage() produces. If no messages are
// left at all, the preview is cleared to "" rather than left stale.
const deleteMessage = async (messageId, userId) => {
  const message = await Message.findOne({ _id: messageId, senderId: userId, isDeleted: false });
  if (!message) throw ApiError.notFound("Message not found");

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.text = "";
  message.attachments = [];
  await message.save();

  const latestMessage = await Message.findOne({ conversationId: message.conversationId })
    .sort({ createdAt: -1 })
    .lean();

  const wasLatest = !latestMessage || latestMessage._id.toString() === message._id.toString();

  if (wasLatest) {
    const newLatest = await Message.findOne({ conversationId: message.conversationId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    await conversationService.touchLastMessage(
      message.conversationId,
      newLatest ? newLatest.senderId : userId,
      newLatest ? buildPreviewText(newLatest.text, newLatest.attachments) : ""
    );
  }

  return { success: true, message: "Message deleted", data: null };
};

const markAsRead = async (conversationId, userId) => {
  await conversationService.assertParticipant(conversationId, userId);

  await Message.updateMany(
    { conversationId, isDeleted: false, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  return { success: true, message: "Messages marked as read", data: null };
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markAsRead
};