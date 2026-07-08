// backend/src/modules/communities/services/community.service.js

const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const Conversation = require("../../communication/models/Conversation");
const ApiError = require("../../../shared/errors/ApiError");
const { hasPermission, getMemberOrThrow } = require("./communityMember.service");
const {
  MEMBER_ROLES, VISIBILITY, COMMUNITY_STATUS, PAGINATION,
  getJoinMode
} = require("../constants/community.constants");

// Simple slug generator — lowercase, hyphenated, then a short random
// suffix to avoid collisions without an extra DB round-trip on every
// retry. Uniqueness is still enforced by the schema's unique index;
// this just makes collisions rare in practice.
const generateSlug = (name) => {
  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
};

const createCommunity = async (userId, payload) => {
  const slug = generateSlug(payload.name);

  // NOTE: MongoDB Standalone does not support multi-document transactions.
  // We use sequential saves here. If any step fails, the catch block throws
  // and the partially created documents (if any) are orphaned — acceptable
  // in development. For production, migrate to a Replica Set or Atlas.
  let community, conversation, member;
  try {
    community = await Community.create({ ...payload, slug, ownerId: userId });

    conversation = await Conversation.create({
      type: "community",
      communityId: community._id,
      participants: [],
      createdBy: userId
    });

    community.conversationId = conversation._id;
    await community.save();

    member = await CommunityMember.create({
      communityId: community._id,
      userId,
      role: MEMBER_ROLES.OWNER
    });
  } catch (err) {
    // Attempt cleanup on partial failure
    if (community?._id) {
      await Community.deleteOne({ _id: community._id }).catch(() => {});
      if (conversation?._id) await Conversation.deleteOne({ _id: conversation._id }).catch(() => {});
      if (member?._id) await CommunityMember.deleteOne({ _id: member._id }).catch(() => {});
    }
    throw err;
  }

  return { success: true, message: "Community created successfully", data: { community } };
};

const updateCommunity = async (userId, communityId, payload) => {
  const member = await getMemberOrThrow(communityId, userId);
  if (!hasPermission(member.role, "edit_community")) {
    throw ApiError.forbidden("You do not have permission to edit this community");
  }
  const community = await Community.findById(communityId);
  if (!community) throw ApiError.notFound("Community not found");

  // "visibility" stays in ALLOWED_FIELDS (public/private/hidden toggle).
  // "settings" also flows through here as a whole object — including
  // settings.requireApproval — so an owner/leader can flip a PUBLIC
  // community into "approval required" mode from the same edit form,
  // no separate endpoint needed.
  const ALLOWED_FIELDS = [
    "description", "rules", "coverImage", "coverImagePublicId",
    "avatar", "avatarPublicId", "tags", "settings", "visibility"
  ];
  ALLOWED_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) community[field] = payload[field];
  });
  await community.save();

  return { success: true, message: "Community updated", data: { community } };
};

const archiveCommunity = async (userId, communityId) => {
  const member = await getMemberOrThrow(communityId, userId);
  if (member.role !== MEMBER_ROLES.OWNER) {
    throw ApiError.forbidden("Only the owner can archive this community");
  }
  await Community.updateOne({ _id: communityId }, { $set: { status: COMMUNITY_STATUS.ARCHIVED } });
  return { success: true, message: "Community archived", data: null };
};

const getCommunityById = async (communityId, viewerId = null) => {
  const community = await Community.findById(communityId).lean();
  if (!community) throw ApiError.notFound("Community not found");

  let viewerMembership = null;
  if (viewerId) {
    viewerMembership = await CommunityMember.findOne({ communityId, userId: viewerId }).lean();
  }
  const isMember = !!viewerMembership;

  if (community.visibility !== VISIBILITY.PUBLIC && !isMember) {
    // Hidden communities 404 instead of 403 so their existence isn't leaked.
    if (community.visibility === VISIBILITY.HIDDEN) throw ApiError.notFound("Community not found");
    throw ApiError.forbidden("This community is private — request to join to view details");
  }

  return {
    success: true,
    message: "Community fetched",
    data: { community: { ...community, isMember, joinMode: getJoinMode(community, isMember) }, viewerMembership }
  };
};

const listPublicCommunities = async ({
  category,
  page = PAGINATION.DEFAULT_PAGE,
  limit = PAGINATION.DEFAULT_LIMIT,
  viewerId = null
} = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const skip = (Number(page) - 1) * pageSize;

  // FIX: was `visibility: VISIBILITY.PUBLIC` only. Now includes PRIVATE
  // too — HIDDEN is the only tier still excluded (existence-leak rule).
  const filter = {
    visibility: { $in: [VISIBILITY.PUBLIC, VISIBILITY.PRIVATE] },
    status: COMMUNITY_STATUS.ACTIVE
  };
  if (category) filter.category = category;

  const [communities, total] = await Promise.all([
    Community.find(filter).sort({ memberCount: -1 }).skip(skip).limit(pageSize).lean(),
    Community.countDocuments(filter)
  ]);

  // One batched membership lookup for the whole page — never a
  // per-community query (would be N+1 at 20 communities/page).
  let memberCommunityIds = new Set();
  if (viewerId && communities.length) {
    const memberships = await CommunityMember.find({
      userId: viewerId,
      communityId: { $in: communities.map((c) => c._id) }
    }).select("communityId").lean();
    memberCommunityIds = new Set(memberships.map((m) => m.communityId.toString()));
  }

  const shaped = communities.map((c) => {
    const isMember = memberCommunityIds.has(c._id.toString());
    return { ...c, isMember, joinMode: getJoinMode(c, isMember) };
  });

  return { communities: shaped, pagination: { total, page: Number(page), limit: pageSize } };
};

module.exports = {
  createCommunity,
  updateCommunity,
  archiveCommunity,
  getCommunityById,
  listPublicCommunities
};