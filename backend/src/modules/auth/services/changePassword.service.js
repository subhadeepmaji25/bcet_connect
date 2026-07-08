// backend/src/modules/auth/services/changePassword.service.js
const User = require("../models/User");
const validatePassword = require("../../../shared/utils/passwordValidator");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const ApiError = require("../../../shared/errors/ApiError");

const changePassword = async ({
  userId,
  oldPassword,
  newPassword
}) => {
  if (!oldPassword || !newPassword) {
    throw ApiError.badRequest("Old password and new password are required");
  }

  try {
    validatePassword(newPassword);
  } catch (error) {
    throw ApiError.badRequest(error.message);
  }

  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (user.isDeleted) {
    throw ApiError.unauthorized("Account no longer available");
  }

  if (user.accountStatus === "suspended") {
    throw ApiError.forbidden("Account suspended");
  }

  if (user.accountStatus === "rejected") {
    throw ApiError.forbidden("Account rejected");
  }

  const isOldPasswordValid = await user.comparePassword(oldPassword);

  if (!isOldPasswordValid) {
    throw ApiError.unauthorized("Old password is incorrect");
  }

  const isSamePassword = await user.comparePassword(newPassword);

  if (isSamePassword) {
    throw ApiError.badRequest("New password must be different from current password");
  }

  await user.setPassword(newPassword);

  user.loginAttempts = 0;
  user.lockUntil = null;
  user.lastSeenAt = new Date();
  user.tokenVersion += 1;

  await user.save();

  // Security-relevant event — always notify, this is the most
  // important one in the whole module (user needs to know if this
  // wasn't them). notify() is fire-and-forget and never throws.
  await notify(NOTIFICATION_EVENTS.PASSWORD_CHANGED, {
    userId: user._id,
    data: {},
    meta: {}
  });

  return {
    success: true,
    message: "Password changed successfully. Please login again.",
    data: {
      userId: user._id,
      username: user.username,
      tokenVersion: user.tokenVersion
    }
  };
};

module.exports = { changePassword };
