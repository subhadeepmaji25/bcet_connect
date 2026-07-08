// backend/src/modules/communities/models/CommunityPost.js
const mongoose = require("mongoose");
const { POST_TYPES, POST_TYPES_VALUES, POST_STATUS, POST_STATUS_VALUES } = require("../constants/community.constants");

// Attachment shape intentionally mirrors what Communication module's
// attachment.service.js already returns from Cloudinary — reused as-is,
// no new upload pipeline for community posts.
const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "voice", "document"], required: true }
}, { _id: false });

const communityPostSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  content: { type: String, trim: true, maxlength: 2000, default: "" },
  attachments: { type: [attachmentSchema], default: [] },
  mentions: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

  postType: { type: String, enum: POST_TYPES_VALUES, default: POST_TYPES.NORMAL },

  pinned: { type: Boolean, default: false },
  pinnedAt: { type: Date, default: null },

  likeCount: { type: Number, default: 0, min: 0 },
  commentCount: { type: Number, default: 0, min: 0 },

  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },

  status: { type: String, enum: POST_STATUS_VALUES, default: POST_STATUS.ACTIVE }
}, { timestamps: true, versionKey: false });

// Normal feed scroll — cursor pagination on _id/createdAt, never skip().
communityPostSchema.index({ communityId: 1, createdAt: -1 });
// Pinned-section query kept separate from normal feed query at the
// service layer (mixing pinned + normal in one query breaks cursor
// logic the moment a post gets pinned mid-scroll).
communityPostSchema.index({ communityId: 1, pinned: -1, pinnedAt: -1 });
communityPostSchema.index({ communityId: 1, status: 1 });

module.exports = mongoose.model("CommunityPost", communityPostSchema);