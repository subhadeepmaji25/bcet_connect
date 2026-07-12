// backend/src/modules/learning/controllers/learningProgress.controller.js
//
// NEW MODULE — Learning (Academic Learning domain, Phase 4).
// Thin layer, same shape as resourceEngagement.controller.js.

const progressService = require("../services/learningProgress.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const markAsOpenedController = asyncHandler(async (req, res) => {
  const result = await progressService.markAsOpened(req.user.id, req.user.role, req.params.resourceId);
  return sendResponse(res, result);
});

const updateProgressController = asyncHandler(async (req, res) => {
  const result = await progressService.updateProgress(req.user.id, req.user.role, req.params.resourceId, req.body);
  return sendResponse(res, result);
});

const getMyProgressController = asyncHandler(async (req, res) => {
  const progress = await progressService.getMyProgress(req.user.id, req.params.resourceId);
  return sendResponse(res, { success: true, message: "Progress fetched successfully", data: { progress } });
});

const getContinueLearningController = asyncHandler(async (req, res) => {
  const items = await progressService.getContinueLearning(req.user.id, req.query);
  return sendResponse(res, { success: true, message: "Continue learning fetched", data: { items } });
});

// Faculty-facing — ownership of "which resources this Faculty may
// query" is intentionally NOT re-checked here; add a subjectService.
// assertSubjectOwnership() call here once this route is exposed to
// Faculty broadly (currently fine for admin-only use if mounted behind
// allowRoles("admin") — tighten before opening to allowRoles("faculty")).
const getResourceProgressStatsController = asyncHandler(async (req, res) => {
  const result = await progressService.getResourceProgressStats(req.params.resourceId);
  return sendResponse(res, result);
});

module.exports = {
  markAsOpenedController,
  updateProgressController,
  getMyProgressController,
  getContinueLearningController,
  getResourceProgressStatsController
};
