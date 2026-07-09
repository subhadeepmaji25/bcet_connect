// backend/src/modules/feed/models/FeedComment.js
const mongoose = require("mongoose");
const { COMMENT_STATUS, COMMENT_STATUS_VALUES } = require("../constants/feed.constants");

const feedCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  content: { type: String, trim: true, required: true, maxlength: 1000 },

  // null = top-level comment, set = reply. No separate Reply model —
  // same pattern as CommunityComment.js.
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedComment", default: null, index: true },

  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },

  status: { type: String, enum: COMMENT_STATUS_VALUES, default: COMMENT_STATUS.ACTIVE }
}, { timestamps: true, versionKey: false });

feedCommentSchema.index({ postId: 1, createdAt: 1 });
feedCommentSchema.index({ postId: 1, parentCommentId: 1 });

module.exports = mongoose.model("FeedComment", feedCommentSchema);