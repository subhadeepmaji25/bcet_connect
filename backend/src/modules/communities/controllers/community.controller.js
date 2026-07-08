// backend/src/modules/communities/controllers/community.controller.js
const communityService = require("../services/community.service");
const communitySearchService = require("../services/communitySearch.service"); // NEW
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createCommunityController = asyncHandler(async (req, res) => {
  const result = await communityService.createCommunity(req.user.id, req.body);
  logger.info("Community created", { module: "Communities", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const updateCommunityController = asyncHandler(async (req, res) => {
  const result = await communityService.updateCommunity(req.user.id, req.params.communityId, req.body);
  logger.info("Community updated", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, result);
});

const archiveCommunityController = asyncHandler(async (req, res) => {
  const result = await communityService.archiveCommunity(req.user.id, req.params.communityId);
  logger.info("Community archived", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, result);
});

// FIXED pattern from mentorship bug history: optionalAuthMiddleware on
// the route means req.user may be undefined for guests — always use
// req.user?.id || null here, never req.user.id directly.
const getCommunityByIdController = asyncHandler(async (req, res) => {
  const viewerId = req.user?.id || null;
  const result = await communityService.getCommunityById(req.params.communityId, viewerId);
  return sendResponse(res, result);
});

const listPublicCommunitiesController = asyncHandler(async (req, res) => {
  const result = await communityService.listPublicCommunities(req.query);
  return sendResponse(res, {
    success: true,
    message: "Communities fetched successfully",
    data: { communities: result.communities },
    meta: { pagination: result.pagination }
  });
});

// NEW — Phase 3
const searchCommunitiesController = asyncHandler(async (req, res) => {
  const result = await communitySearchService.searchCommunities(req.query);
  return sendResponse(res, {
    success: true,
    message: "Communities search results",
    data: { communities: result.communities },
    meta: { pagination: result.pagination }
  });
});

module.exports = {
  createCommunityController,
  updateCommunityController,
  archiveCommunityController,
  getCommunityByIdController,
  listPublicCommunitiesController,
  searchCommunitiesController // NEW
};