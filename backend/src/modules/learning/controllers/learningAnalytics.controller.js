// backend/src/modules/learning/controllers/learningAnalytics.controller.js
//
// Thin wiring layer for learningAnalytics.service.js — that service was
// already fully written but had zero controller/route reaching it.
// This file is the only thing needed to make it reachable.

const analyticsService = require("../services/learningAnalytics.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const getSubjectAnalyticsController = asyncHandler(async (req, res) => {
  const result = await analyticsService.getSubjectAnalytics(req.params.subjectId, req.user.id, req.user.role);
  return sendResponse(res, result);
});

const getFacultyOverviewController = asyncHandler(async (req, res) => {
  const result = await analyticsService.getFacultyOverview(req.user.id, req.user.role);
  return sendResponse(res, result);
});

const getMyLearningStatsController = asyncHandler(async (req, res) => {
  const result = await analyticsService.getMyLearningStats(req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  getSubjectAnalyticsController,
  getFacultyOverviewController,
  getMyLearningStatsController
};