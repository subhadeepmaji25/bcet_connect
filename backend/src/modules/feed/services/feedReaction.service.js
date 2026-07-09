// backend/src/modules/feed/services/feedReaction.service.js
const mongoose = require("mongoose");
const FeedPost = require("../models/FeedPost");
const FeedComment = require("../models/FeedComment");
const FeedReaction = require("../models/FeedReaction");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { canViewPost } = require("./feedAccess.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const {
  POST_STATUS,
  COMMENT_STATUS,
  MODERATION_STATUS,
  REACTION_TARGET_TYPE
} = require("../constants/feed.constants");

const activeModeratedFilter = {
  $or: [
    { moderationStatus: MODERATION_STATUS.APPROVED },
    { moderationStatus: { $exists: false } }
  ]
};

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const loadReactablePost = async (userId, postId) => {
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE, ...activeModeratedFilter });
  if (!post) throw ApiError.notFound("Post not found");
  if (!(await canViewPost(userId, post))) throw ApiError.notFound("Post not found");
  return post;
};

const applyReaction = async ({ userId, targetType, target, targetFilter, updateModel, type }) => {
  const existing = await FeedReaction.findOne(targetFilter);

  if (existing && existing.type === type) {
    await FeedReaction.deleteOne({ _id: existing._id });
    await updateModel.updateOne({ _id: target._id }, { $pull: { likedBy: userId }, $inc: { likeCount: -1 } });
    return { success: true, message: "Reaction removed", data: { reacted: false } };
  }

  if (existing) {
    existing.type = type;
    existing.targetType = targetType;
    await existing.save();
    return { success: true, message: "Reaction updated", data: { reacted: true, type } };
  }

  await FeedReaction.create({ ...targetFilter, targetType, userId, type });
  await updateModel.updateOne({ _id: target._id }, { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } });
  return { success: true, message: "Reaction added", data: { reacted: true, type } };
};

const react = async (userId, postId, type) => {
  const post = await loadReactablePost(userId, postId);
  const result = await applyReaction({
    userId,
    targetType: REACTION_TARGET_TYPE.POST,
    target: post,
    targetFilter: { postId, userId },
    updateModel: FeedPost,
    type
  });

  if (result.data?.reacted && post.authorId.toString() !== userId.toString()) {
    const reactorName = await getUsernameSafe(userId);
    await notify(N_EVENTS.FEED_POST_LIKED, {
      userId: post.authorId,
      data: { likerName: reactorName },
      meta: { postId, reactionType: type }
    });
  }

  return result;
};

const reactToComment = async (userId, commentId, type) => {
  const comment = await FeedComment.findOne({
    _id: commentId,
    status: COMMENT_STATUS.ACTIVE,
    ...activeModeratedFilter
  });
  if (!comment) throw ApiError.notFound("Comment not found");
  await loadReactablePost(userId, comment.postId);

  return applyReaction({
    userId,
    targetType: REACTION_TARGET_TYPE.COMMENT,
    target: comment,
    targetFilter: { commentId, userId },
    updateModel: FeedComment,
    type
  });
};

const getReactionSummary = async (postId) => {
  const rows = await FeedReaction.aggregate([
    { $match: { postId: new mongoose.Types.ObjectId(postId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);
  return rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});
};

const getCommentReactionSummary = async (commentId) => {
  const rows = await FeedReaction.aggregate([
    { $match: { commentId: new mongoose.Types.ObjectId(commentId) } },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);
  return rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});
};

const getMyReaction = async (userId, postId) => {
  const reaction = await FeedReaction.findOne({ postId, userId }).select("type").lean();
  return reaction ? reaction.type : null;
};

const getMyCommentReaction = async (userId, commentId) => {
  const reaction = await FeedReaction.findOne({ commentId, userId }).select("type").lean();
  return reaction ? reaction.type : null;
};

module.exports = {
  react,
  reactToComment,
  getReactionSummary,
  getCommentReactionSummary,
  getMyReaction,
  getMyCommentReaction
};
