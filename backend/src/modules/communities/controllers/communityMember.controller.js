// backend/src/modules/communities/controllers/communityMember.controller.js
const communityMemberService = require("../services/communityMember.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const joinCommunityController = asyncHandler(async (req, res) => {
  const result = await communityMemberService.joinCommunity(req.user.id, req.params.communityId);
  logger.info("User joined community", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const leaveCommunityController = asyncHandler(async (req, res) => {
  const result = await communityMemberService.leaveCommunity(req.user.id, req.params.communityId);
  logger.info("User left community", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, result);
});

const changeRoleController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { newRole } = req.body;
  const result = await communityMemberService.changeRole(req.user.id, targetUserId, req.params.communityId, newRole);
  logger.info("Member role changed", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId, newRole
  });
  return sendResponse(res, result);
});

const transferOwnershipController = asyncHandler(async (req, res) => {
  const { newOwnerUserId } = req.body;
  const result = await communityMemberService.transferOwnership(req.user.id, newOwnerUserId, req.params.communityId);
  logger.info("Ownership transferred", {
    module: "Communities", fromUserId: req.user.id, toUserId: newOwnerUserId, communityId: req.params.communityId
  });
  return sendResponse(res, result);
});

const removeMemberController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const result = await communityMemberService.removeMember(req.user.id, targetUserId, req.params.communityId);
  logger.info("Member removed", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId
  });
  return sendResponse(res, result);
});

const muteMemberController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { mutedUntil } = req.body;
  const result = await communityMemberService.muteMember(req.user.id, targetUserId, req.params.communityId, mutedUntil);
  logger.info("Member muted", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId
  });
  return sendResponse(res, result);
});

// NEW: counterpart to muteMemberController — no body needed, mutedUntil is just cleared.
const unmuteMemberController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const result = await communityMemberService.unmuteMember(req.user.id, targetUserId, req.params.communityId);
  logger.info("Member unmuted", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId
  });
  return sendResponse(res, result);
});

// NEW: bans a member (isBanned/banReason/bannedAt — previously dead fields, now real).
const banMemberController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { reason } = req.body;
  const result = await communityMemberService.banMember(req.user.id, targetUserId, req.params.communityId, reason);
  logger.info("Member banned", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId, reason: reason || null
  });
  return sendResponse(res, result);
});

// NEW: counterpart to banMemberController.
const unbanMemberController = asyncHandler(async (req, res) => {
  const { userId: targetUserId } = req.params;
  const result = await communityMemberService.unbanMember(req.user.id, targetUserId, req.params.communityId);
  logger.info("Member unbanned", {
    module: "Communities", actingUserId: req.user.id, targetUserId, communityId: req.params.communityId
  });
  return sendResponse(res, result);
});

// FIX: service's getMembers() signature changed to
// getMembers(communityId, viewerId, { page, limit }) — must now pass
// req.user.id as viewerId, otherwise every non-PUBLIC community wrongly
// 403s/404s for its own members. Route already sits behind authMiddleware
// (see routes file), so req.user is always defined here.
const getMembersController = asyncHandler(async (req, res) => {
  const result = await communityMemberService.getMembers(req.params.communityId, req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Members fetched successfully",
    data: { members: result.members },
    meta: { pagination: result.pagination }
  });
});

const getMyMembershipController = asyncHandler(async (req, res) => {
  const membership = await communityMemberService.getMyMembership(req.user.id, req.params.communityId);
  return sendResponse(res, {
    success: true,
    message: "Membership status fetched",
    data: { membership }
  });
});

module.exports = {
  joinCommunityController,
  leaveCommunityController,
  changeRoleController,
  transferOwnershipController,
  removeMemberController,
  muteMemberController,
  unmuteMemberController,
  banMemberController,
  unbanMemberController,
  getMembersController,
  getMyMembershipController
};