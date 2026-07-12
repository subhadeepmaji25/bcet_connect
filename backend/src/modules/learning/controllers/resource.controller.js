// backend/src/modules/learning/controllers/resource.controller.js
//
// FIX (Phase 1c): listResourcesController used to call
// resourceService.listResourcesForStudent() unconditionally for every
// role. Faculty/Admin hitting GET /resources therefore got the
// student-scoped view (silently empty/wrong for Admin, whose Profile
// often has no department set). Now dispatches based on req.user.role —
// students get listResourcesForStudent() (department/semester/section
// visibility rules), Faculty/Admin get listResourcesForStaff()
// (subject-ownership scoped for Faculty, unscoped for Admin).

const resourceService = require("../services/resource.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const uploadResourceController = asyncHandler(async (req, res) => {
  const result = await resourceService.uploadResource(req.user.id, req.user.role, req.body, req.file);
  logger.info("Resource uploaded", { module: "Learning", userId: req.user.id, subjectId: req.body.subjectId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const verifyResourceController = asyncHandler(async (req, res) => {
  const { decision, rejectionReason } = req.body;
  const result = await resourceService.verifyResource(req.params.resourceId, req.user.id, req.user.role, decision, rejectionReason);
  logger.info("Resource verification decision", { module: "Learning", facultyId: req.user.id, resourceId: req.params.resourceId, decision });
  return sendResponse(res, result);
});

// ── FIXED (Phase 1c) ────────────────────────────────────────────────
const listResourcesController = asyncHandler(async (req, res) => {
  const result = req.user.role === "student"
    ? await resourceService.listResourcesForStudent(req.user.id, req.query)
    : await resourceService.listResourcesForStaff(req.user.id, req.user.role, req.query);
  return sendResponse(res, {
    success: true,
    message: "Resources fetched successfully",
    data: { resources: result.resources },
    meta: { pagination: result.pagination }
  });
});

const listPendingResourcesController = asyncHandler(async (req, res) => {
  const result = await resourceService.listPendingForFaculty(req.user.id, req.user.role, req.query);
  return sendResponse(res, { success: true, message: "Pending resources fetched", data: { resources: result.resources }, meta: { pagination: result.pagination } });
});

const getMyUploadsController = asyncHandler(async (req, res) => {
  const result = await resourceService.getMyUploads(req.user.id, req.query);
  return sendResponse(res, { success: true, message: "Your uploads fetched", data: { resources: result.resources }, meta: { pagination: result.pagination } });
});

const getResourceByIdController = asyncHandler(async (req, res) => {
  const resource = await resourceService.getResourceById(req.params.resourceId, req.user.id, req.user.role);
  return sendResponse(res, { success: true, message: "Resource fetched successfully", data: { resource } });
});

const deleteResourceController = asyncHandler(async (req, res) => {
  const result = await resourceService.deleteResource(req.params.resourceId, req.user.id, req.user.role);
  logger.info("Resource deleted", { module: "Learning", userId: req.user.id, resourceId: req.params.resourceId });
  return sendResponse(res, result);
});

module.exports = {
  uploadResourceController,
  verifyResourceController,
  listResourcesController,
  listPendingResourcesController,
  getMyUploadsController,
  getResourceByIdController,
  deleteResourceController
};
