// backend/src/modules/communities/services/communityComment.service.js
const CommunityPost = require("../models/CommunityPost");
const CommunityComment = require("../models/CommunityComment");
const ApiError = require("../../../shared/errors/ApiError");
const { hasPermission, getMemberOrThrow } = require("./communityMember.service");
const { notify } = require("../../notification/listeners/notification.listener"); // NEW
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants"); // NEW
const User = require("../../auth/models/User"); // NEW — same path mentorship services use
const { PAGINATION } = require("../constants/community.constants");

const createComment = async (userId, postId, { content, parentCommentId = null }) => {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status === "removed") throw ApiError.notFound("Post not found");

  await getMemberOrThrow(post.communityId, userId);

  if (parentCommentId) {
    const parent = await CommunityComment.findById(parentCommentId);
    if (!parent || parent.postId.toString() !== postId.toString()) {
      throw ApiError.badRequest("Invalid parent comment");
    }
  }

  const comment = await CommunityComment.create({
    postId, communityId: post.communityId, authorId: userId, content, parentCommentId
  });

  await CommunityPost.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });

  // NEW: notify the post author — skip if they're commenting on their own post.
  if (post.authorId.toString() !== userId.toString()) {
    const commenter = await User.findById(userId).select("username");
    await notify(N_EVENTS.COMMUNITY_COMMENT_RECEIVED, {
      userId: post.authorId,
      data: { commenterName: commenter?.username || "Someone" },
      meta: { communityId: post.communityId, postId, commentId: comment._id }
    });
  }

  return { success: true, message: "Comment added", data: { comment } };
};

const editComment = async (userId, commentId, content) => {
  const comment = await CommunityComment.findById(commentId);
  if (!comment || comment.status === "removed") throw ApiError.notFound("Comment not found");
  if (comment.authorId.toString() !== userId.toString()) {
    throw ApiError.forbidden("You can only edit your own comments");
  }
  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();
  return { success: true, message: "Comment updated", data: { comment } };
};

const deleteComment = async (userId, commentId) => {
  const comment = await CommunityComment.findById(commentId);
  if (!comment || comment.status === "removed") throw ApiError.notFound("Comment not found");

  const isAuthor = comment.authorId.toString() === userId.toString();
  if (!isAuthor) {
    const member = await getMemberOrThrow(comment.communityId, userId);
    if (!hasPermission(member.role, "delete_comment")) {
      throw ApiError.forbidden("You do not have permission to delete this comment");
    }
  }

  comment.status = "removed";
  await comment.save();
  await CommunityPost.updateOne({ _id: comment.postId }, { $inc: { commentCount: -1 } });

  return { success: true, message: "Comment deleted", data: null };
};

// Top-level comments cursor-paginated; replies fetched per-parent on
// demand (kept simple — avoids building a full nested tree server-side
// for a 500-member-scale feature).
const getComments = async (postId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { postId, parentCommentId: null, status: "active" };
  if (cursor) filter._id = { $gt: cursor };

  const comments = await CommunityComment.find(filter)
    .sort({ _id: 1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = comments.length === pageSize ? comments[comments.length - 1]._id : null;
  return { comments, nextCursor };
};

const getReplies = async (parentCommentId) => {
  const replies = await CommunityComment.find({ parentCommentId, status: "active" })
    .sort({ createdAt: 1 })
    .populate("authorId", "username role")
    .lean();
  return replies;
};

module.exports = { createComment, editComment, deleteComment, getComments, getReplies };