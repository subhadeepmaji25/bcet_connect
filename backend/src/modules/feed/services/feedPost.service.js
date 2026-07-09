// backend/src/modules/feed/services/feedPost.service.js
const FeedPost = require("../models/FeedPost");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { getCandidateAuthorIds } = require("./feedCandidate.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const { POST_STATUS, LIMITS, PAGINATION } = require("../constants/feed.constants");

// Same safe-lookup pattern used across connections/mentorship/communities
// services — a name-lookup failure must never block the actual action.
const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const createPost = async (userId, { type, content, attachments = [], tags = [], mentions = [], visibility }) => {
  if (mentions.length > LIMITS.MENTIONS_MAX_PER_POST) {
    throw ApiError.badRequest(`Cannot mention more than ${LIMITS.MENTIONS_MAX_PER_POST} users`);
  }

  // Only accept mentions that resolve to a real user — a stale/bad id
  // is silently dropped rather than crashing post creation.
  let validMentionIds = [];
  if (mentions.length) {
    const validUsers = await User.find({ _id: { $in: mentions } }).select("_id").lean();
    validMentionIds = validUsers.map((u) => u._id);
  }

  const post = await FeedPost.create({
    authorId: userId, type, content, attachments, tags, mentions: validMentionIds, visibility
  });

  if (validMentionIds.length) {
    const authorName = await getUsernameSafe(userId);
    await Promise.all(
      validMentionIds
        .filter((id) => id.toString() !== userId.toString()) // no self-mention notification
        .map((mentionedId) =>
          notify(N_EVENTS.FEED_MENTIONED, {
            userId: mentionedId,
            data: { authorName },
            meta: { postId: post._id, mentionedBy: userId }
          })
        )
    );
  }

  return { success: true, message: "Post created", data: { post } };
};

const editPost = async (userId, postId, { content, attachments, tags }) => {
  const post = await FeedPost.findOne({ _id: postId, authorId: userId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");

  if (content !== undefined) post.content = content;
  if (attachments !== undefined) post.attachments = attachments;
  if (tags !== undefined) post.tags = tags;
  post.isEdited = true;
  post.editedAt = new Date();
  await post.save();

  return { success: true, message: "Post updated", data: { post } };
};

const deletePost = async (userId, postId) => {
  const post = await FeedPost.findOne({ _id: postId, authorId: userId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");

  post.status = POST_STATUS.REMOVED;
  await post.save();

  return { success: true, message: "Post deleted", data: null };
};

// Toggle (like/unlike). CommunityPost's likePost() is $inc-only because
// that scope never required unlike — a global feed does.
const toggleLike = async (userId, postId) => {
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");

  const alreadyLiked = post.likedBy.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    await FeedPost.updateOne({ _id: postId }, { $pull: { likedBy: userId }, $inc: { likeCount: -1 } });
    return { success: true, message: "Post unliked", data: { liked: false } };
  }

  await FeedPost.updateOne({ _id: postId }, { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } });

  if (post.authorId.toString() !== userId.toString()) {
    const likerName = await getUsernameSafe(userId);
    await notify(N_EVENTS.FEED_POST_LIKED, {
      userId: post.authorId,
      data: { likerName },
      meta: { postId }
    });
  }

  return { success: true, message: "Post liked", data: { liked: true } };
};

// PHASE 1: candidates = connections + self, plain chronological cursor
// scroll. No scoring formula — see feedCandidate.service.js.
const getFeed = async (userId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const candidateIds = await getCandidateAuthorIds(userId);
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);

  const filter = { authorId: { $in: candidateIds }, status: POST_STATUS.ACTIVE };
  if (cursor) filter._id = { $lt: cursor };

  const posts = await FeedPost.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = posts.length === pageSize ? posts[posts.length - 1]._id : null;

  return { posts, nextCursor };
};

const getPostById = async (postId) => {
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE })
    .populate("authorId", "username role")
    .lean();
  if (!post) throw ApiError.notFound("Post not found");
  return post;
};

// Profile "activity" view — reusable by any profile page.
const getUserPosts = async (targetUserId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { authorId: targetUserId, status: POST_STATUS.ACTIVE };
  if (cursor) filter._id = { $lt: cursor };

  const posts = await FeedPost.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = posts.length === pageSize ? posts[posts.length - 1]._id : null;
  return { posts, nextCursor };
};

module.exports = { createPost, editPost, deletePost, toggleLike, getFeed, getPostById, getUserPosts };