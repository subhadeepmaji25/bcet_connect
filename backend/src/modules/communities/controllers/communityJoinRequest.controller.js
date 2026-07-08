// backend/src/modules/communities/controllers/communityJoinRequest.controller.js
const communityJoinRequestService = require("../services/communityJoinRequest.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createRequestController = asyncHandler(async (req, res) => {
  const result = await communityJoinRequestService.createRequest(req.user.id, req.params.communityId, req.body);
  logger.info("Join request created", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const approveRequestController = asyncHandler(async (req, res) => {
  const result = await communityJoinRequestService.approveRequest(req.user.id, req.params.requestId);
  logger.info("Join request approved", { module: "Communities", adminId: req.user.id, requestId: req.params.requestId });
  return sendResponse(res, result);
});

const rejectRequestController = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const result = await communityJoinRequestService.rejectRequest(req.user.id, req.params.requestId, reason);
  logger.info("Join request rejected", { module: "Communities", adminId: req.user.id, requestId: req.params.requestId });
  return sendResponse(res, result);
});

const getPendingRequestsController = asyncHandler(async (req, res) => {
  const result = await communityJoinRequestService.getPendingRequests(req.user.id, req.params.communityId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Pending join requests fetched successfully",
    data: { requests: result.requests },
    meta: { pagination: result.pagination }
  });
});

module.exports = {
  createRequestController,
  approveRequestController,
  rejectRequestController,
  getPendingRequestsController
};