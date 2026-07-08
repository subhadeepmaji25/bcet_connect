// backend/src/modules/communities/services/communityJoinRequest.service.js
//
// FIXED (this update): createRequest() previously blocked ALL public
// communities unconditionally ("join directly instead of requesting"),
// even when the owner had turned on settings.requireApproval. That
// left a PUBLIC + requireApproval community with no working join path
// at all — joinCommunity() (pre-fix) let people bypass approval, and
// createRequest() refused to create a request for them. Now both
// services check the same requiresJoinRequest() helper, so a PUBLIC
// community with requireApproval=true correctly routes here, and one
// without it correctly stays on the instant-join path.

const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const CommunityJoinRequest = require("../models/CommunityJoinRequest");
const ApiError = require("../../../shared/errors/ApiError");
const { hasPermission, addMemberDirectly } = require("./communityMember.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const {
  JOIN_REQUEST_STATUS,
  MEMBER_ROLES,
  PAGINATION,
  requiresJoinRequest
} = require("../constants/community.constants");

const createRequest = async (userId, communityId, { message } = {}) => {
  const community = await Community.findById(communityId);
  if (!community) throw ApiError.notFound("Community not found");

  // FIX: was `if (community.visibility === VISIBILITY.PUBLIC) throw ...`
  // — blocked every public community's join-request, including ones
  // with requireApproval turned on. Now only blocks when the community
  // genuinely doesn't need a request at all (public, no approval flag).
  if (!requiresJoinRequest(community)) {
    throw ApiError.badRequest("This community is public and does not require approval — join directly instead of requesting");
  }

  const existingMember = await CommunityMember.findOne({ communityId, userId });
  if (existingMember) throw ApiError.conflict("You are already a member of this community");
  const existingPending = await CommunityJoinRequest.findOne({
    communityId, userId, status: JOIN_REQUEST_STATUS.PENDING
  });
  if (existingPending) throw ApiError.conflict("You already have a pending request for this community");

  const request = await CommunityJoinRequest.create({ communityId, userId, message: message || "" });

  const leaders = await CommunityMember.find({
    communityId,
    role: { $in: [MEMBER_ROLES.OWNER, MEMBER_ROLES.LEADER, MEMBER_ROLES.CO_LEADER] }
  }).select("userId");
  await Promise.all(
    leaders.map((l) =>
      notify(N_EVENTS.COMMUNITY_JOIN_REQUEST_CREATED, { userId: l.userId, meta: { communityId, requestId: request._id, requesterId: userId } })
    )
  );

  return { success: true, message: "Join request sent", data: { request } };
};

const approveRequest = async (actingUserId, requestId) => {
  const request = await CommunityJoinRequest.findById(requestId);
  if (!request) throw ApiError.notFound("Join request not found");
  if (request.status !== JOIN_REQUEST_STATUS.PENDING) {
    throw ApiError.conflict("This request has already been responded to");
  }

  const actingMember = await CommunityMember.findOne({ communityId: request.communityId, userId: actingUserId });
  if (!actingMember || !hasPermission(actingMember.role, "approve_join_request")) {
    throw ApiError.forbidden("You do not have permission to approve join requests");
  }

  // Reuses communityMember.service's addMemberDirectly — join logic is
  // never duplicated between the direct-join and request-approval paths.
  await addMemberDirectly(request.communityId, request.userId, MEMBER_ROLES.MEMBER);

  request.status = JOIN_REQUEST_STATUS.APPROVED;
  request.respondedBy = actingUserId;
  request.respondedAt = new Date();
  await request.save();

  await notify(N_EVENTS.COMMUNITY_JOIN_REQUEST_APPROVED, { userId: request.userId, meta: { communityId: request.communityId } });

  return { success: true, message: "Join request approved", data: { request } };
};

const rejectRequest = async (actingUserId, requestId, reason = "") => {
  const request = await CommunityJoinRequest.findById(requestId);
  if (!request) throw ApiError.notFound("Join request not found");
  if (request.status !== JOIN_REQUEST_STATUS.PENDING) {
    throw ApiError.conflict("This request has already been responded to");
  }

  const actingMember = await CommunityMember.findOne({ communityId: request.communityId, userId: actingUserId });
  if (!actingMember || !hasPermission(actingMember.role, "approve_join_request")) {
    throw ApiError.forbidden("You do not have permission to reject join requests");
  }

  request.status = JOIN_REQUEST_STATUS.REJECTED;
  request.respondedBy = actingUserId;
  request.respondedAt = new Date();
  await request.save();

  await notify(N_EVENTS.COMMUNITY_JOIN_REQUEST_REJECTED, { userId: request.userId, meta: { communityId: request.communityId, reason } });

  return { success: true, message: "Join request rejected", data: { request } };
};

const getPendingRequests = async (actingUserId, communityId, { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const actingMember = await CommunityMember.findOne({ communityId, userId: actingUserId });
  if (!actingMember || !hasPermission(actingMember.role, "approve_join_request")) {
    throw ApiError.forbidden("You do not have permission to view join requests");
  }

  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const skip = (Number(page) - 1) * pageSize;
  const filter = { communityId, status: JOIN_REQUEST_STATUS.PENDING };
  const [rawRequests, total] = await Promise.all([
    CommunityJoinRequest.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize)
      .populate("userId", "username email role")
      .lean(),
    CommunityJoinRequest.countDocuments(filter)
  ]);

  const requests = rawRequests.map((r) => ({
    requestId: r._id,
    id: r.userId?._id || null,       // requester's User id
    username: r.userId?.username || null,
    email: r.userId?.email || null,
    accountRole: r.userId?.role || null,
    message: r.message,
    status: r.status,
    createdAt: r.createdAt
  }));

  return { requests, pagination: { total, page: Number(page), limit: pageSize } };
};

module.exports = { createRequest, approveRequest, rejectRequest, getPendingRequests };