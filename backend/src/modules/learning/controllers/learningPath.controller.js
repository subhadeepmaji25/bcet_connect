// backend/src/modules/learning/controllers/learningPath.controller.js
//
// UPDATED (Phase 4 — Career Learning Path progress): added
// enrollInPathController/updateStepProgressController/
// getMyPathProgressController — thin wrappers, same shape every other
// controller in this file already follows, mirroring
// learningProgress.controller.js's markAsOpenedController/
// updateProgressController/getMyProgressController one level up (path
// instead of resource).

const pathService = require("../services/learningPath.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const createPathController = asyncHandler(async (req, res) => {
  const result = await pathService.createPath(req.user.id, req.user.role, req.body);
  return sendResponse(res, { statusCode: 201, ...result });
});

const updatePathController = asyncHandler(async (req, res) => {
  const result = await pathService.updatePath(req.params.pathId, req.user.id, req.user.role, req.body);
  return sendResponse(res, result);
});

const publishPathController = asyncHandler(async (req, res) => {
  const result = await pathService.publishPath(req.params.pathId, req.user.id, req.user.role);
  return sendResponse(res, result);
});

const archivePathController = asyncHandler(async (req, res) => {
  const result = await pathService.archivePath(req.params.pathId, req.user.id, req.user.role);
  return sendResponse(res, result);
});

const listPathsController = asyncHandler(async (req, res) => {
  const result = await pathService.listPaths(req.query);
  return sendResponse(res, {
    success: true,
    message: "Learning paths fetched successfully",
    data: { paths: result.paths },
    meta: { pagination: result.pagination }
  });
});

const getMyPathsController = asyncHandler(async (req, res) => {
  const result = await pathService.getMyPaths(req.user.id, req.user.role, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your learning paths fetched successfully",
    data: { paths: result.paths },
    meta: { pagination: result.pagination }
  });
});

const getPathByIdController = asyncHandler(async (req, res) => {
  const path = await pathService.getPathById(req.params.pathId);
  return sendResponse(res, { success: true, message: "Learning path fetched successfully", data: { path } });
});

// ── Phase 4 — Enrollment & step progress ────────────────────────────

const enrollInPathController = asyncHandler(async (req, res) => {
  const result = await pathService.enrollInPath(req.user.id, req.params.pathId);
  return sendResponse(res, result);
});

const updateStepProgressController = asyncHandler(async (req, res) => {
  const result = await pathService.updateStepProgress(req.user.id, req.params.pathId, req.params.stepId, req.body);
  return sendResponse(res, result);
});

const getMyPathProgressController = asyncHandler(async (req, res) => {
  const progress = await pathService.getMyPathProgress(req.user.id, req.params.pathId);
  return sendResponse(res, { success: true, message: "Path progress fetched successfully", data: { progress } });
});

module.exports = {
  createPathController,
  updatePathController,
  publishPathController,
  archivePathController,
  listPathsController,
  getMyPathsController,
  getPathByIdController,
  enrollInPathController, // NEW (Phase 4)
  updateStepProgressController, // NEW (Phase 4)
  getMyPathProgressController // NEW (Phase 4)
};