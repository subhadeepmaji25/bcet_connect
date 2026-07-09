// backend/src/modules/feed/models/FeedComment.js
//
// PHASE 2 UPDATE: added likeCount + likedBy — denormalized cache,
// same pattern FeedPost already uses. Source of truth for individual
// reactions is FeedReaction (targetType: "comment"); these two fields
// are just a fast-read cache so comment lists don't need a $lookup
// aggregation to show like counts. feedReaction.service.js keeps this
// in sync via $inc/$addToSet/$pull on toggle — same as FeedPost's
// toggleLike() already does for posts.
//
// Everything else (threading via parentCommentId, no separate Reply
// model) is unchanged from Phase 1.

const mongoose = require("mongoose");
const {
  COMMENT_STATUS,
  COMMENT_STATUS_VALUES,
  MODERATION_STATUS,
  MODERATION_STATUS_VALUES
} = require("../constants/feed.constants");

const feedCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, trim: true, required: true, maxlength: 1000 },

  // null = top-level comment, set = reply. No separate Reply model —
  // same pattern as CommunityComment.js.
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedComment", default: null, index: true },

  // NEW (Phase 2) — denormalized reaction cache, see file header.
  likeCount: { type: Number, default: 0, min: 0 },
  likedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },
  reportCount: { type: Number, default: 0, min: 0 },

  moderationStatus: { type: String, enum: MODERATION_STATUS_VALUES, default: MODERATION_STATUS.APPROVED, index: true },
  moderationReasons: { type: [String], default: [] },

  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },

  status: { type: String, enum: COMMENT_STATUS_VALUES, default: COMMENT_STATUS.ACTIVE }
}, { timestamps: true, versionKey: false });

feedCommentSchema.index({ postId: 1, createdAt: 1 });
feedCommentSchema.index({ postId: 1, parentCommentId: 1 });

module.exports = mongoose.model("FeedComment", feedCommentSchema);
