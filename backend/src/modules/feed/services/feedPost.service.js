// backend/src/modules/feed/services/feedPost.service.js
const FeedPost = require("../models/FeedPost");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { getCandidateAuthorIds } = require("./feedCandidate.service");
const { rankFeedPosts } = require("./feedRanking.service");
const { injectRecommendations } = require("./feedRecommendationInjector");
const { injectCommunityPosts } = require("./feedCommunityInjector");
const { react } = require("./feedReaction.service");
const { assertContentAllowed, inspectContent } = require("./feedModeration.service");
const { canViewPost, filterVisiblePosts } = require("./feedAccess.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const {
  POST_TYPE,
  POST_STATUS,
  MODERATION_STATUS,
  LIMITS,
  PAGINATION,
  REACTION_TYPE,
  FEED_ADMIN_ROLES,
  FEED_ANNOUNCEMENT_ROLES
} = require("../constants/feed.constants");

const ACTIVE_VISIBLE_FILTER = {
  status: POST_STATUS.ACTIVE,
  $or: [
    { moderationStatus: MODERATION_STATUS.APPROVED },
    { moderationStatus: { $exists: false } }
  ]
};

const PINNED_FIRST_PAGE_LIMIT = 3;

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const isFeedAdmin = (role) => FEED_ADMIN_ROLES.includes(role);

const assertCanCreateType = (role, type) => {
  if (type === POST_TYPE.ANNOUNCEMENT && !FEED_ANNOUNCEMENT_ROLES.includes(role)) {
    throw ApiError.forbidden("Only admin or faculty can create feed announcements");
  }
};

const createPost = async (userId, userRole, { type, content, attachments = [], tags = [], mentions = [], visibility }) => {
  assertCanCreateType(userRole, type);

  if (mentions.length > LIMITS.MENTIONS_MAX_PER_POST) {
    throw ApiError.badRequest(`Cannot mention more than ${LIMITS.MENTIONS_MAX_PER_POST} users`);
  }

  const moderation = assertContentAllowed(content || "", "post");

  let validMentionIds = [];
  if (mentions.length) {
    const validUsers = await User.find({ _id: { $in: mentions }, isDeleted: false }).select("_id").lean();
    validMentionIds = validUsers.map((u) => u._id);
  }

  const post = await FeedPost.create({
    authorId: userId,
    type,
    content,
    attachments,
    tags,
    mentions: validMentionIds,
    visibility,
    moderationStatus: moderation.status,
    moderationReasons: moderation.reasons
  });

  if (validMentionIds.length) {
    const authorName = await getUsernameSafe(userId);
    await Promise.all(
      validMentionIds
        .filter((id) => id.toString() !== userId.toString())
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

  if (content !== undefined) {
    const moderation = assertContentAllowed(content, "post");
    post.content = content;
    post.moderationStatus = moderation.status;
    post.moderationReasons = moderation.reasons;
  }
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
  post.isPinned = false;
  post.pinnedBy = null;
  post.pinnedAt = null;
  await post.save();

  return { success: true, message: "Post deleted", data: null };
};

const toggleLike = (userId, postId) => react(userId, postId, REACTION_TYPE.LIKE);

const buildPostFilter = (authorIds, cursor, extra = {}) => {
  const filter = {
    ...ACTIVE_VISIBLE_FILTER,
    authorId: { $in: authorIds },
    ...extra
  };
  if (cursor) filter._id = { $lt: cursor };
  return filter;
};

const getFeed = async (userId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const { authorIds, sourceFlags } = await getCandidateAuthorIds(userId);
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const isFirstPage = !cursor;
  const pinnedLimit = isFirstPage && pageSize > 1
    ? Math.min(PINNED_FIRST_PAGE_LIMIT, pageSize - 1)
    : 0;

  const pinnedPosts = isFirstPage
    ? await FeedPost.find(buildPostFilter(authorIds, null, { isPinned: true }))
      .sort({ pinnedAt: -1, _id: -1 })
      .limit(pinnedLimit)
      .populate("authorId", "username role")
      .lean()
    : [];

  const remaining = Math.max(pageSize - pinnedPosts.length, 0);
  const recentPosts = remaining
    ? await FeedPost.find(buildPostFilter(authorIds, cursor, { isPinned: { $ne: true } }))
      .sort({ _id: -1 })
      .limit(remaining)
      .populate("authorId", "username role")
      .lean()
    : [];

  const visiblePinned = await filterVisiblePosts(userId, pinnedPosts);
  const visibleRecent = await filterVisiblePosts(userId, recentPosts);
  const rankedRecent = rankFeedPosts(visibleRecent, sourceFlags);
  const realPosts = [...visiblePinned, ...rankedRecent].slice(0, pageSize);
  const posts = isFirstPage
    ? await injectRecommendations(await injectCommunityPosts(realPosts, userId), userId)
    : realPosts;

  const nextCursor = recentPosts.length === remaining && recentPosts.length
    ? recentPosts[recentPosts.length - 1]._id
    : null;

  return { posts, nextCursor };
};

const getPostById = async (viewerId, viewerRole, postId) => {
  const post = await FeedPost.findOne({ _id: postId, ...ACTIVE_VISIBLE_FILTER })
    .populate("authorId", "username role")
    .lean();
  if (!post) throw ApiError.notFound("Post not found");
  if (!isFeedAdmin(viewerRole) && !(await canViewPost(viewerId, post))) {
    throw ApiError.notFound("Post not found");
  }
  return post;
};

const getUserPosts = async (viewerId, viewerRole, targetUserId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { ...ACTIVE_VISIBLE_FILTER, authorId: targetUserId };
  if (cursor) filter._id = { $lt: cursor };

  const posts = await FeedPost.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const visiblePosts = isFeedAdmin(viewerRole) ? posts : await filterVisiblePosts(viewerId, posts);
  const nextCursor = posts.length === pageSize ? posts[posts.length - 1]._id : null;
  return { posts: visiblePosts, nextCursor };
};

const togglePin = async (adminId, adminRole, postId, pinned = true) => {
  if (!isFeedAdmin(adminRole)) throw ApiError.forbidden("Only admins can pin feed posts");
  const post = await FeedPost.findOne({ _id: postId, status: POST_STATUS.ACTIVE });
  if (!post) throw ApiError.notFound("Post not found");

  post.isPinned = Boolean(pinned);
  post.pinnedBy = pinned ? adminId : null;
  post.pinnedAt = pinned ? new Date() : null;
  await post.save();

  return {
    success: true,
    message: pinned ? "Post pinned" : "Post unpinned",
    data: { post }
  };
};

const moderatePost = async (adminId, adminRole, postId, { action, note = "" } = {}) => {
  if (!isFeedAdmin(adminRole)) throw ApiError.forbidden("Only admins can moderate feed posts");
  const post = await FeedPost.findOne({ _id: postId });
  if (!post) throw ApiError.notFound("Post not found");

  if (action === "hide") {
    post.status = POST_STATUS.HIDDEN;
    post.isPinned = false;
    post.pinnedBy = null;
    post.pinnedAt = null;
  } else if (action === "restore") {
    const moderation = inspectContent(post.content || "");
    if (moderation.status !== MODERATION_STATUS.APPROVED) {
      throw ApiError.badRequest("Post still violates feed community guidelines");
    }
    post.status = POST_STATUS.ACTIVE;
    post.moderationStatus = MODERATION_STATUS.APPROVED;
    post.moderationReasons = [];
  } else {
    throw ApiError.badRequest("action must be 'hide' or 'restore'");
  }

  post.moderationReasons = note ? [`admin:${note}`] : post.moderationReasons;
  await post.save();
  return { success: true, message: `Post ${action}d`, data: { post } };
};

module.exports = {
  createPost,
  editPost,
  deletePost,
  toggleLike,
  getFeed,
  getPostById,
  getUserPosts,
  togglePin,
  moderatePost,
  isFeedAdmin
};
