// backend/src/modules/admin/controllers/adminDashboard.controller.js
const adminDashboardService = require("../services/adminDashboard.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const getOverviewController = asyncHandler(async (req, res) => {
  const result = await adminDashboardService.getDashboardOverview();
  return sendResponse(res, result);
});

const getUserStatsController = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getUserStats();
  return sendResponse(res, { success: true, message: "User stats fetched", data });
});

const getPendingCountsController = asyncHandler(async (req, res) => {
  const data = await adminDashboardService.getPendingCounts();
  return sendResponse(res, { success: true, message: "Pending counts fetched", data });
});

module.exports = {
  getOverviewController,
  getUserStatsController,
  getPendingCountsController
};