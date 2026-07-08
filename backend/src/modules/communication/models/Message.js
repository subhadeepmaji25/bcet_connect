// backend/src/modules/communication/models/Message.js
//
// The actual chat content. Has zero knowledge of Mentorship, Connections,
// or permissions — only knows its Conversation. Attachments are embedded
// (not a separate collection/model) because an attachment never exists
// independently of the message it belongs to — same reasoning Resume.js
// uses for embedding version metadata rather than a standalone model.

const mongoose = require("mongoose");
const {
  MESSAGE_TYPE_VALUES,
  MESSAGE_TYPES,
  MESSAGE_STATUS_VALUES,
  MESSAGE_STATUS,
  ATTACHMENT_TYPE_VALUES,
  ATTACHMENT_TYPES,
  LIMITS
} = require("../constants/communication.constants");

const attachmentSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ATTACHMENT_TYPE_VALUES, required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary reference, for deletion
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    originalName: { type: String, trim: true, default: "" },
    // NEW: only meaningful for voice_note/video attachments — left null
    // for image/document. Client-reported (see attachment.service.js),
    // not derived from actually probing the file.
    duration: {
      type: Number,
      min: 0,
      max: LIMITS.MAX_ATTACHMENT_DURATION_SECONDS,
      default: null
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    text: { type: String, trim: true, maxlength: LIMITS.MESSAGE_TEXT_MAX, default: "" },
    attachments: { type: [attachmentSchema], default: [] },
    messageType: { type: String, enum: MESSAGE_TYPE_VALUES, default: MESSAGE_TYPES.TEXT },

    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },

    status: { type: String, enum: MESSAGE_STATUS_VALUES, default: MESSAGE_STATUS.SENT },
    readBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },

    isDeleted: { type: Boolean, default: false }, // soft delete only
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

messageSchema.index({ conversationId: 1, createdAt: -1 }); // paginated history
messageSchema.index({ conversationId: 1, isDeleted: 1 });

module.exports = mongoose.model("Message", messageSchema);