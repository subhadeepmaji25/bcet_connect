// backend/src/modules/users/controllers/profile.controller.js
const {
  updateProfile,
  getProfileByUserId,
  getPublicProfile,
  updateLastActive,
  setCRStatus, // NEW (Phase 1a)
} = require("../services/profile.service");

const { uploadAvatar, deleteAvatar } = require("../services/avatar.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const updateProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await updateProfile(userId, req.body);
    logger.info("Profile updated", { module: "Users", userId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Profile update failed", error, { module: "Users" });
    next(error);
  }
};

const getMyProfileController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await getProfileByUserId(userId);
    return sendResponse(res, {
      success: true,
      message: "Profile fetched successfully",
      data: { profile },
    });
  } catch (error) {
    logger.error("Get my profile failed", error, { module: "Users" });
    next(error);
  }
};

const getPublicProfileController = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const viewerId = req.user.id;
    const { profile, connectionStatus } = await getPublicProfile(viewerId, targetUserId);
    return sendResponse(res, {
      success: true,
      message: "Public profile fetched successfully",
      data: { profile, connectionStatus },
    });
  } catch (error) {
    logger.error("Get public profile failed", error, { module: "Users" });
    next(error);
  }
};

const updateLastActiveController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await updateLastActive(userId);
    return sendResponse(res, {
      success: true,
      message: "Activity updated",
      data: null,
    });
  } catch (error) {
    logger.error("Update last active failed", error, { module: "Users" });
    next(error);
  }
};

const uploadAvatarController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await uploadAvatar(userId, req.file);
    logger.info("Avatar uploaded", { module: "Users", userId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Avatar upload failed", error, { module: "Users" });
    next(error);
  }
};

const deleteAvatarController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await deleteAvatar(userId);
    logger.info("Avatar removed", { module: "Users", userId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Avatar delete failed", error, { module: "Users" });
    next(error);
  }
};

// ── NEW (Phase 1a) ────────────────────────────────────────────────
// req.user.role is NOT re-passed into the service — role gating for
// this action lives entirely at the route layer (allowRoles("faculty",
// "admin")), same trust boundary already used by learning.routes.js's
// verify/publish/archive endpoints.
const setCRStatusController = async (req, res, next) => {
  try {
    const { userId: targetUserId } = req.params;
    const { isCR } = req.body;
    const result = await setCRStatus(targetUserId, isCR);
    logger.info("CR status changed", { module: "Users", actingUserId: req.user.id, targetUserId, isCR });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Set CR status failed", error, { module: "Users" });
    next(error);
  }
};

module.exports = {
  updateProfileController,
  getMyProfileController,
  getPublicProfileController,
  updateLastActiveController,
  uploadAvatarController,
  deleteAvatarController,
  setCRStatusController, // NEW
};