// backend/src/modules/feed/models/FeedPost.js
//
// Deliberately SEPARATE from CommunityPost (modules/communities).
// FeedPost's visibility comes from multiple sources (connections now,
// communities/mentors in Phase 2). CommunityPost's comes from one
// CommunityMember check. Merging them spreads source-type branching
// through every query on both models — keep them apart, same reasoning
// already applied when Communities' Feed vs Chat was split.

const mongoose = require("mongoose");
const {
  POST_TYPE_VALUES,
  VISIBILITY, VISIBILITY_VALUES,
  POST_STATUS, POST_STATUS_VALUES
} = require("../constants/feed.constants");

// Mirrors what Communication/Communities attachment.service.js already
// returns from Cloudinary — reused as-is, no new upload pipeline here.
const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, required: true },
  type: { type: String, enum: ["image", "video", "voice_note", "document"], required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  originalName: { type: String, trim: true, default: "" },
  duration: { type: Number, default: null }
}, { _id: false });

const feedPostSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  type: { type: String, enum: POST_TYPE_VALUES, default: "text" },
  content: { type: String, trim: true, maxlength: 3000, default: "" },
  attachments: { type: [attachmentSchema], default: [] },

  tags: { type: [{ type: String, lowercase: true, trim: true }], default: [] },
  mentions: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

  visibility: { type: String, enum: VISIBILITY_VALUES, default: VISIBILITY.PUBLIC },

  likeCount: { type: Number, default: 0, min: 0 },
  likedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
  commentCount: { type: Number, default: 0, min: 0 },

  // Reserved for faculty/admin announcements — not wired to any
  // permission check in Phase 1, exists so no migration is needed later.
  isPinned: { type: Boolean, default: false },

  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },

  status: { type: String, enum: POST_STATUS_VALUES, default: POST_STATUS.ACTIVE }
}, { timestamps: true, versionKey: false });

// Profile "my posts" view.
feedPostSchema.index({ authorId: 1, createdAt: -1 });
// Main feed scroll — cursor pagination on _id, never skip().
feedPostSchema.index({ status: 1, createdAt: -1 });
// #hashtag / Search module lookups.
feedPostSchema.index({ tags: 1 });

module.exports = mongoose.model("FeedPost", feedPostSchema);