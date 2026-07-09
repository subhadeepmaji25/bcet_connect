// backend/src/modules/feed/services/feedComment.service.js
const FeedPost = require("../models/FeedPost");
const FeedComment = require("../models/FeedComment");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const { POST_STATUS, COMMENT_STATUS, PAGINATION } = require("../constants/feed.constants");

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const createComment = async (userId, postId, { content, parentCommentId = null }) => {
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");

  if (parentCommentId) {
    const parent = await FeedComment.findById(parentCommentId);
    if (!parent || parent.postId.toString() !== postId.toString()) {
      throw ApiError.badRequest("Invalid parent comment");
    }
  }

  const comment = await FeedComment.create({ postId, authorId: userId, content, parentCommentId });
  await FeedPost.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

  if (post.authorId.toString() !== userId.toString()) {
    const commenterName = await getUsernameSafe(userId);
    await notify(N_EVENTS.FEED_COMMENT_RECEIVED, {
      userId: post.authorId,
      data: { commenterName },
      meta: { postId, commentId: comment._id }
    });
  }

  return { success: true, message: "Comment added", data: { comment } };
};

const editComment = async (userId, commentId, content) => {
  const comment = await FeedComment.findOne({ _id: commentId, authorId: userId, status: COMMENT_STATUS.ACTIVE });
  if (!comment) throw ApiError.notFound("Comment not found");

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  return { success: true, message: "Comment updated", data: { comment } };
};

// Author-only delete — Feed has no moderator role (global feed, not a
// per-community space), unlike CommunityComment's delete which also
// allows a moderator with "delete_comment" permission.
const deleteComment = async (userId, commentId) => {
  const comment = await FeedComment.findOne({ _id: commentId, status: COMMENT_STATUS.ACTIVE });
  if (!comment) throw ApiError.notFound("Comment not found");
  if (comment.authorId.toString() !== userId.toString()) {
    throw ApiError.forbidden("You can only delete your own comments");
  }

  comment.status = COMMENT_STATUS.REMOVED;
  await comment.save();
  await FeedPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });

  return { success: true, message: "Comment deleted", data: null };
};

const getComments = async (postId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { postId, parentCommentId: null, status: COMMENT_STATUS.ACTIVE };
  if (cursor) filter._id = { $gt: cursor };

  const comments = await FeedComment.find(filter)
    .sort({ _id: 1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = comments.length === pageSize ? comments[comments.length - 1]._id : null;
  return { comments, nextCursor };
};

const getReplies = async (parentCommentId) => {
  const replies = await FeedComment.find({ parentCommentId, status: COMMENT_STATUS.ACTIVE })
    .sort({ createdAt: 1 })
    .populate("authorId", "username role")
    .lean();
  return replies;
};

module.exports = { createComment, editComment, deleteComment, getComments, getReplies };