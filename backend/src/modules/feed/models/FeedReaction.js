// backend/src/modules/feed/models/FeedReaction.js
const mongoose = require("mongoose");
const {
  REACTION_TYPE_VALUES,
  REACTION_TARGET_TYPE,
  REACTION_TARGET_TYPE_VALUES
} = require("../constants/feed.constants");

const feedReactionSchema = new mongoose.Schema({
  targetType: {
    type: String,
    enum: REACTION_TARGET_TYPE_VALUES,
    default: REACTION_TARGET_TYPE.POST,
    index: true
  },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", default: null, index: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedComment", default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: REACTION_TYPE_VALUES, required: true }
}, { timestamps: true, versionKey: false });

// Existing post reactions already use postId + userId. Comment reactions
// get their own unique path so the two target types do not collide.
feedReactionSchema.index(
  { postId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { postId: { $type: "objectId" } } }
);
feedReactionSchema.index(
  { commentId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { commentId: { $type: "objectId" } } }
);
feedReactionSchema.index({ postId: 1, type: 1 });
feedReactionSchema.index({ commentId: 1, type: 1 });

module.exports = mongoose.model("FeedReaction", feedReactionSchema);
