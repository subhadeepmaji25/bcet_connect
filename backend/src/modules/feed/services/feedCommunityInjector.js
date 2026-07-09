// backend/src/modules/feed/services/feedCommunityInjector.js
const CommunityMember = require("../../communities/models/CommunityMember");
const CommunityPost = require("../../communities/models/CommunityPost");
const Community = require("../../communities/models/Community");
const { POST_STATUS, POST_TYPES } = require("../../communities/constants/community.constants");

const MAX_COMMUNITIES = 20;
const MAX_COMMUNITY_CARDS = 2;
const INSERT_AFTER_EVERY = 4;

const toCommunityCard = (post) => ({
  isCommunityPost: true,
  recommendationType: "community_post",
  _id: `community_post_${post._id}`,
  communityPostId: post._id,
  community: post.communityId
    ? { _id: post.communityId._id, name: post.communityId.name, slug: post.communityId.slug }
    : null,
  author: post.authorId,
  content: post.content,
  attachments: post.attachments || [],
  postType: post.postType,
  likeCount: post.likeCount || 0,
  commentCount: post.commentCount || 0,
  createdAt: post.createdAt
});

const injectCommunityPosts = async (posts, userId) => {
  const memberships = await CommunityMember.find({ userId, isBanned: false })
    .select("communityId")
    .limit(MAX_COMMUNITIES)
    .lean();

  const communityIds = memberships.map((m) => m.communityId);
  if (!communityIds.length) return posts;

  const activeCommunities = await Community.find({ _id: { $in: communityIds }, status: "active" })
    .select("_id")
    .lean();
  const activeCommunityIds = activeCommunities.map((c) => c._id);
  if (!activeCommunityIds.length) return posts;

  const communityPosts = await CommunityPost.find({
    communityId: { $in: activeCommunityIds },
    status: POST_STATUS.ACTIVE,
    $or: [
      { pinned: true },
      { postType: POST_TYPES.ANNOUNCEMENT }
    ]
  })
    .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 })
    .limit(MAX_COMMUNITY_CARDS)
    .populate("authorId", "username role")
    .populate("communityId", "name slug")
    .lean();

  if (!communityPosts.length) return posts;

  const result = [...posts];
  communityPosts.map(toCommunityCard).forEach((card, index) => {
    const insertAt = Math.min((index + 1) * INSERT_AFTER_EVERY, result.length);
    result.splice(insertAt, 0, card);
  });
  return result;
};

module.exports = { injectCommunityPosts };
