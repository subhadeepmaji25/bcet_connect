// backend/src/modules/admin/controllers/adminApproval.controller.js
const adminApprovalService = require("../services/adminApproval.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const getUnifiedQueueController = asyncHandler(async (req, res) => {
  const result = await adminApprovalService.getUnifiedPendingQueue(req.query);
  return sendResponse(res, result);
});

const getQueueByTypeController = asyncHandler(async (req, res) => {
  const result = await adminApprovalService.getPendingByType(req.params.type, req.query);
  return sendResponse(res, {
    success: true,
    message: `Pending ${req.params.type} queue fetched`,
    data: result
  });
});

const decideApprovalController = asyncHandler(async (req, res) => {
  const result = await adminApprovalService.decideApproval(
    req.params.type,
    req.params.itemId,
    req.user.id,
    req.body
  );
  logger.info("Approval decision made", {
    module: "Admin",
    adminId: req.user.id,
    type: req.params.type,
    itemId: req.params.itemId,
    decision: req.body.decision
  });
  return sendResponse(res, result);
});

module.exports = {
  getUnifiedQueueController,
  getQueueByTypeController,
  decideApprovalController
};