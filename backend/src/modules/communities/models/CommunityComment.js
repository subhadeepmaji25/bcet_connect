// backend/src/modules/communities/models/CommunityComment.js
const mongoose = require("mongoose");

const communityCommentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  content: { type: String, trim: true, required: true, maxlength: 500 },

  // null = top-level comment, set = reply to another comment.
  // No separate Reply model — same pattern as the rest of the project
  // keeps things flat and query-simple.
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityComment", default: null, index: true },

  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },

  status: { type: String, enum: ["active", "removed"], default: "active" }
}, { timestamps: true, versionKey: false });

// Fetch all comments for a post, oldest first, cheaply.
communityCommentSchema.index({ postId: 1, createdAt: 1 });
// Fetch replies under a specific parent comment.
communityCommentSchema.index({ postId: 1, parentCommentId: 1 });

module.exports = mongoose.model("CommunityComment", communityCommentSchema);