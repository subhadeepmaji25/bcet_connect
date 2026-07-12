// backend/src/modules/admin/controllers/adminUser.controller.js
const adminUserService = require("../services/adminUser.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const approveUserController = asyncHandler(async (req, res) => {
  const result = await adminUserService.approveUser(req.params.userId, req.user.id);
  logger.info("User approved", { module: "Admin", adminId: req.user.id, userId: req.params.userId });
  return sendResponse(res, result);
});

const rejectUserController = asyncHandler(async (req, res) => {
  const result = await adminUserService.rejectUser(req.params.userId, req.user.id, req.body.reason);
  logger.info("User rejected", { module: "Admin", adminId: req.user.id, userId: req.params.userId });
  return sendResponse(res, result);
});

const suspendUserController = asyncHandler(async (req, res) => {
  const result = await adminUserService.suspendUser(req.params.userId, req.user.id, req.body.reason);
  logger.info("User suspended", { module: "Admin", adminId: req.user.id, userId: req.params.userId });
  return sendResponse(res, result);
});

const banUserController = asyncHandler(async (req, res) => {
  const result = await adminUserService.banUser(req.params.userId, req.user.id, req.body.reason);
  logger.info("User banned", { module: "Admin", adminId: req.user.id, userId: req.params.userId });
  return sendResponse(res, result);
});

const activateUserController = asyncHandler(async (req, res) => {
  const result = await adminUserService.activateUser(req.params.userId, req.user.id);
  logger.info("User activated", { module: "Admin", adminId: req.user.id, userId: req.params.userId });
  return sendResponse(res, result);
});

const getPendingUsersController = asyncHandler(async (req, res) => {
  const result = await adminUserService.getPendingUsers(req.query);
  return sendResponse(res, {
    success: true,
    message: "Pending users fetched",
    data: { users: result.users },
    meta: { pagination: result.pagination }
  });
});

const listUsersController = asyncHandler(async (req, res) => {
  const result = await adminUserService.listUsers(req.query);
  return sendResponse(res, {
    success: true,
    message: "Users fetched",
    data: { users: result.users },
    meta: { pagination: result.pagination }
  });
});

const getUserByIdController = asyncHandler(async (req, res) => {
  const result = await adminUserService.getUserById(req.params.userId);
  return sendResponse(res, result);
});

module.exports = {
  approveUserController,
  rejectUserController,
  suspendUserController,
  banUserController,
  activateUserController,
  getPendingUsersController,
  listUsersController,
  getUserByIdController
};