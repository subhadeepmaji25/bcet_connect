// backend/src/modules/communities/services/communityPost.service.js
//
// UPDATED:
// 1. createPost now broadcasts NOTIFICATION_EVENTS.COMMUNITY_ANNOUNCEMENT
//    to every member of the community when postType === "announcement" —
//    previously only @mentioned users were notified, so an "official"
//    announcement from a leader silently reached almost nobody. Broadcast
//    is chunked (BROADCAST_BATCH_SIZE) so a 500-member community doesn't
//    fire hundreds of concurrent notify() calls in a single Promise.all.
// 2. A user who is both mentioned AND a recipient of the announcement
//    broadcast is only notified once — mentioned userIds are excluded
//    from the broadcast list to avoid a duplicate notification.
// 3. The author of the announcement is excluded from their own broadcast.

const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const CommunityPost = require("../models/CommunityPost");
const ApiError = require("../../../shared/errors/ApiError");
const { hasPermission, getMemberOrThrow } = require("./communityMember.service");
const { notify } = require("../../notification/listeners/notification.listener");
const {
  NOTIFICATION_EVENTS: N_EVENTS,
  BROADCAST_BATCH_SIZE
} = require("../../notification/constants/notification.constants");
const { POST_STATUS, PAGINATION, LIMITS } = require("../constants/community.constants");

// Splits an array into fixed-size chunks — used so a broadcast
// notification to a large member list runs in sequential batches
// instead of one giant Promise.all of a few hundred concurrent calls.
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const broadcastAnnouncement = async ({ community, post, authorId, excludeUserIds = [] }) => {
  const excludeSet = new Set([authorId.toString(), ...excludeUserIds.map((id) => id.toString())]);

  const members = await CommunityMember.find({ communityId: community._id })
    .select("userId")
    .lean();

  const recipientIds = members
    .map((m) => m.userId)
    .filter((id) => !excludeSet.has(id.toString()));

  if (!recipientIds.length) return;

  const batches = chunkArray(recipientIds, BROADCAST_BATCH_SIZE);
  for (const batch of batches) {
    await Promise.all(
      batch.map((userId) =>
        notify(N_EVENTS.COMMUNITY_ANNOUNCEMENT, {
          userId,
          meta: {
            communityId: community._id,
            communityName: community.name,
            postId: post._id,
            authorId
          }
        })
      )
    );
  }
};

const createPost = async (userId, communityId, { content, attachments = [], mentions = [], postType }) => {
  const member = await getMemberOrThrow(communityId, userId);

  if (postType === "announcement" && !hasPermission(member.role, "manage_feed")) {
    throw ApiError.forbidden("Only leaders can post announcements");
  }
  if (mentions.length > LIMITS.MENTIONS_MAX_PER_POST) {
    throw ApiError.badRequest(`Cannot mention more than ${LIMITS.MENTIONS_MAX_PER_POST} users`);
  }

  const post = await CommunityPost.create({
    communityId, authorId: userId, content, attachments, mentions,
    postType: postType || "normal"
  });

  await Community.updateOne({ _id: communityId }, { $inc: { postCount: 1 } });

  // Mentioned users always get a direct MENTIONED notification,
  // regardless of postType — this is separate from the broadcast below.
  let validMentionUserIds = [];
  if (mentions.length) {
    const validMentions = await CommunityMember.find({
      communityId, userId: { $in: mentions }
    }).select("userId");
    validMentionUserIds = validMentions.map((m) => m.userId);

    await Promise.all(
      validMentions.map((m) =>
        notify(N_EVENTS.MENTIONED, { userId: m.userId, meta: { communityId, postId: post._id, mentionedBy: userId } })
      )
    );
  }

  // Announcement posts broadcast to every member (except the author and
  // anyone already notified via @mention above, to avoid double-notify).
  if (postType === "announcement") {
    const community = await Community.findById(communityId).select("name").lean();
    if (community) {
      await broadcastAnnouncement({
        community,
        post,
        authorId: userId,
        excludeUserIds: validMentionUserIds
      });
    }
  }

  return { success: true, message: "Post created", data: { post } };
};

const editPost = async (userId, postId, { content, attachments }) => {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status === POST_STATUS.REMOVED) throw ApiError.notFound("Post not found");
  if (post.authorId.toString() !== userId.toString()) {
    throw ApiError.forbidden("You can only edit your own posts");
  }

  if (content !== undefined) post.content = content;
  if (attachments !== undefined) post.attachments = attachments;
  post.isEdited = true;
  post.editedAt = new Date();
  await post.save();

  return { success: true, message: "Post updated", data: { post } };
};

const deletePost = async (userId, postId) => {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status === POST_STATUS.REMOVED) throw ApiError.notFound("Post not found");

  const isAuthor = post.authorId.toString() === userId.toString();
  if (!isAuthor) {
    const member = await getMemberOrThrow(post.communityId, userId);
    if (!hasPermission(member.role, "delete_post")) {
      throw ApiError.forbidden("You do not have permission to delete this post");
    }
  }

  post.status = POST_STATUS.REMOVED;
  await post.save();
  await Community.updateOne({ _id: post.communityId }, { $inc: { postCount: -1 } });

  return { success: true, message: "Post deleted", data: null };
};

const pinPost = async (userId, postId, pinned = true) => {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status === POST_STATUS.REMOVED) throw ApiError.notFound("Post not found");

  const member = await getMemberOrThrow(post.communityId, userId);
  if (!hasPermission(member.role, "pin_post")) {
    throw ApiError.forbidden("You do not have permission to pin posts");
  }

  post.pinned = pinned;
  post.pinnedAt = pinned ? new Date() : null;
  await post.save();

  return { success: true, message: pinned ? "Post pinned" : "Post unpinned", data: { post } };
};

const likePost = async (userId, postId) => {
  const post = await CommunityPost.findById(postId);
  if (!post || post.status === POST_STATUS.REMOVED) throw ApiError.notFound("Post not found");
  await getMemberOrThrow(post.communityId, userId); // membership required to like

  // Simple counter only — no per-user like-tracking model yet (future
  // CommunityReaction model, per architecture doc's reserved scope).
  await CommunityPost.updateOne({ _id: postId }, { $inc: { likeCount: 1 } });
  return { success: true, message: "Post liked", data: null };
};

// Cursor-based feed — pinned and normal posts are fetched as two
// separate queries and returned as two separate arrays. They are never
// merged into one cursor-paginated query, because a post being pinned
// mid-scroll would silently break a combined cursor's ordering.
const getFeed = async (communityId, viewerId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const community = await Community.findById(communityId).lean();
  if (!community) throw ApiError.notFound("Community not found");

  let viewerMembership = null;
  if (viewerId) viewerMembership = await CommunityMember.findOne({ communityId, userId: viewerId }).lean();
  if (community.visibility !== "public" && !viewerMembership) {
    throw ApiError.forbidden("You must be a member to view this community's feed");
  }

  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const baseFilter = { communityId, status: POST_STATUS.ACTIVE };

  const pinnedPosts = await CommunityPost.find({ ...baseFilter, pinned: true })
    .sort({ pinnedAt: -1 })
    .limit(10)
    .populate("authorId", "username role")
    .lean();

  const feedFilter = { ...baseFilter, pinned: false };
  if (cursor) feedFilter._id = { $lt: cursor };

  const posts = await CommunityPost.find(feedFilter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = posts.length === pageSize ? posts[posts.length - 1]._id : null;

  return { pinnedPosts, posts, nextCursor };
};

const getPostById = async (postId, viewerId = null) => {
  const post = await CommunityPost.findById(postId).populate("authorId", "username role").lean();
  if (!post || post.status === POST_STATUS.REMOVED) throw ApiError.notFound("Post not found");
  return post;
};

module.exports = { createPost, editPost, deletePost, pinPost, likePost, getFeed, getPostById };