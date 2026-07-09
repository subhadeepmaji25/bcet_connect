// backend/src/modules/feed/controllers/feedReport.controller.js
const feedReportService = require("../services/feedReport.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createReportController = asyncHandler(async (req, res) => {
  const result = await feedReportService.createReport(req.user.id, req.body);
  logger.info("Feed report created", { module: "Feed", userId: req.user.id, targetType: req.body.targetType });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getReportsController = asyncHandler(async (req, res) => {
  const result = await feedReportService.getReports(req.user.role, req.query);
  return sendResponse(res, {
    success: true,
    message: "Feed reports fetched successfully",
    data: { reports: result.reports },
    meta: { nextCursor: result.nextCursor }
  });
});

const resolveReportController = asyncHandler(async (req, res) => {
  const result = await feedReportService.resolveReport(req.user.id, req.user.role, req.params.reportId, req.body);
  return sendResponse(res, result);
});

module.exports = {
  createReportController,
  getReportsController,
  resolveReportController
};
