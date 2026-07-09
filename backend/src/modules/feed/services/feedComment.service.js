// backend/src/modules/feed/services/feedComment.service.js
const FeedPost = require("../models/FeedPost");
const FeedComment = require("../models/FeedComment");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { assertContentAllowed, inspectContent } = require("./feedModeration.service");
const { canViewPost } = require("./feedAccess.service");
const { isFeedAdmin } = require("./feedPost.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const { POST_STATUS, COMMENT_STATUS, MODERATION_STATUS, PAGINATION } = require("../constants/feed.constants");

const ACTIVE_COMMENT_FILTER = {
  status: COMMENT_STATUS.ACTIVE,
  $or: [
    { moderationStatus: MODERATION_STATUS.APPROVED },
    { moderationStatus: { $exists: false } }
  ]
};

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const loadVisiblePost = async (viewerId, viewerRole, postId) => {
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");
  if (!isFeedAdmin(viewerRole) && !(await canViewPost(viewerId, post))) {
    throw ApiError.notFound("Post not found");
  }
  return post;
};

const createComment = async (userId, userRole, postId, { content, parentCommentId = null }) => {
  const post = await loadVisiblePost(userId, userRole, postId);
  const moderation = assertContentAllowed(content, "comment");

  if (parentCommentId) {
    const parent = await FeedComment.findOne({ _id: parentCommentId, ...ACTIVE_COMMENT_FILTER });
    if (!parent || parent.postId.toString() !== postId.toString()) {
      throw ApiError.badRequest("Invalid parent comment");
    }
  }

  const comment = await FeedComment.create({
    postId,
    authorId: userId,
    content,
    parentCommentId,
    moderationStatus: moderation.status,
    moderationReasons: moderation.reasons
  });
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

  const moderation = assertContentAllowed(content, "comment");
  comment.content = content;
  comment.moderationStatus = moderation.status;
  comment.moderationReasons = moderation.reasons;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  return { success: true, message: "Comment updated", data: { comment } };
};

const deleteComment = async (userId, userRole, commentId) => {
  const comment = await FeedComment.findOne({ _id: commentId, status: COMMENT_STATUS.ACTIVE });
  if (!comment) throw ApiError.notFound("Comment not found");
  if (comment.authorId.toString() !== userId.toString() && !isFeedAdmin(userRole)) {
    throw ApiError.forbidden("You can only delete your own comments");
  }

  comment.status = COMMENT_STATUS.REMOVED;
  await comment.save();
  await FeedPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });

  return { success: true, message: "Comment deleted", data: null };
};

const getComments = async (viewerId, viewerRole, postId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  await loadVisiblePost(viewerId, viewerRole, postId);
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { postId, parentCommentId: null, ...ACTIVE_COMMENT_FILTER };
  if (cursor) filter._id = { $gt: cursor };

  const comments = await FeedComment.find(filter)
    .sort({ _id: 1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = comments.length === pageSize ? comments[comments.length - 1]._id : null;
  return { comments, nextCursor };
};

const getReplies = async (viewerId, viewerRole, parentCommentId) => {
  const parent = await FeedComment.findOne({ _id: parentCommentId, ...ACTIVE_COMMENT_FILTER }).lean();
  if (!parent) throw ApiError.notFound("Comment not found");
  await loadVisiblePost(viewerId, viewerRole, parent.postId);

  const replies = await FeedComment.find({ parentCommentId, ...ACTIVE_COMMENT_FILTER })
    .sort({ createdAt: 1 })
    .populate("authorId", "username role")
    .lean();
  return replies;
};

const moderateComment = async (adminId, adminRole, commentId, { action, note = "" } = {}) => {
  if (!isFeedAdmin(adminRole)) throw ApiError.forbidden("Only admins can moderate feed comments");
  const comment = await FeedComment.findOne({ _id: commentId });
  if (!comment) throw ApiError.notFound("Comment not found");

  if (action === "hide") {
    if (comment.status === COMMENT_STATUS.ACTIVE) {
      await FeedPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });
    }
    comment.status = COMMENT_STATUS.HIDDEN;
  } else if (action === "restore") {
    const moderation = inspectContent(comment.content || "");
    if (moderation.status !== MODERATION_STATUS.APPROVED) {
      throw ApiError.badRequest("Comment still violates feed community guidelines");
    }
    if (comment.status !== COMMENT_STATUS.ACTIVE) {
      await FeedPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: 1 } });
    }
    comment.status = COMMENT_STATUS.ACTIVE;
    comment.moderationStatus = MODERATION_STATUS.APPROVED;
    comment.moderationReasons = [];
  } else {
    throw ApiError.badRequest("action must be 'hide' or 'restore'");
  }

  comment.moderationReasons = note ? [`admin:${note}`] : comment.moderationReasons;
  await comment.save();
  return { success: true, message: `Comment ${action}d`, data: { comment } };
};

module.exports = {
  createComment,
  editComment,
  deleteComment,
  getComments,
  getReplies,
  moderateComment,
  loadVisiblePost
};
