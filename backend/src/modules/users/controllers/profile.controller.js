// backend/src/modules/users/controllers/profile.controller.js
const {
  updateProfile,
  getProfileByUserId,
  getPublicProfile,
  updateLastActive,
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

// getPublicProfile(viewerId, targetUserId) returns { profile, connectionStatus }
// — a flat object, not just a profile document. Destructure both fields
// out and spread them into `data` directly, rather than re-wrapping the
// whole result as `data: { profile }` (which would double-nest the
// profile as data.profile.profile and silently drop connectionStatus —
// the exact signal the frontend needs to render "Connect" vs "Pending"
// vs "Message" vs "Private profile" on someone else's profile page).
//
// authMiddleware (see user.routes.js) guarantees req.user exists here,
// so viewerId is always a real id, never undefined.
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

// ─────────────────────────────────────────
// Avatar — separate concern from updateProfile(). That controller only
// ever writes body fields the client already has as strings;
// req.file (the actual binary) is handled here, same separation
// resume.controller.js keeps from profile.controller.js.
// ─────────────────────────────────────────
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

module.exports = {
  updateProfileController,
  getMyProfileController,
  getPublicProfileController,
  updateLastActiveController,
  uploadAvatarController,
  deleteAvatarController,
};