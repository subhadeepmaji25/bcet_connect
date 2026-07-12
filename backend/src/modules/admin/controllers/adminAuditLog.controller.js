// backend/src/modules/admin/controllers/adminAuditLog.controller.js
const adminAuditLogService = require("../services/adminAuditLog.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const getAuditLogsController = asyncHandler(async (req, res) => {
  const result = await adminAuditLogService.getAuditLogs(req.query);
  return sendResponse(res, {
    success: true,
    message: "Audit logs fetched",
    data: { logs: result.logs },
    meta: { pagination: result.pagination }
  });
});

const getAuditLogByIdController = asyncHandler(async (req, res) => {
  const log = await adminAuditLogService.getAuditLogById(req.params.logId);
  return sendResponse(res, {
    success: true,
    message: "Audit log entry fetched",
    data: { log }
  });
});

module.exports = {
  getAuditLogsController,
  getAuditLogByIdController
};