// backend/src/modules/admin/controllers/adminModeration.controller.js
const adminModerationService = require("../services/adminModeration.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const getPendingReportsController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.getPendingReports(req.query);
  return sendResponse(res, {
    success: true,
    message: "Pending reports fetched",
    data: { reports: result.reports },
    meta: { pagination: result.pagination }
  });
});

const resolveReportController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.resolveReport(req.params.reportId, req.user.id, req.body);
  logger.info("Report moderated", { module: "Admin", adminId: req.user.id, reportId: req.params.reportId });
  return sendResponse(res, result);
});

const deletePostController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.deletePost(req.params.postId, req.user.id, req.body.reason);
  logger.info("Post deleted by admin", { module: "Admin", adminId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const hidePostController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.hidePost(req.params.postId, req.user.id, req.body.reason);
  logger.info("Post hidden by admin", { module: "Admin", adminId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const suspendCommunityController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.suspendCommunity(req.params.communityId, req.user.id, req.body.reason);
  logger.info("Community suspended", { module: "Admin", adminId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, result);
});

const disbandCommunityController = asyncHandler(async (req, res) => {
  const result = await adminModerationService.disbandCommunity(req.params.communityId, req.user.id, req.body.reason);
  logger.info("Community disbanded", { module: "Admin", adminId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, result);
});

module.exports = {
  getPendingReportsController,
  resolveReportController,
  deletePostController,
  hidePostController,
  suspendCommunityController,
  disbandCommunityController
};