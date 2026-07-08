// backend/src/modules/auth/services/register.service.js

const User = require("../models/User");
const Profile = require("../../users/models/Profile");
const validatePassword = require("../../../shared/utils/passwordValidator");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

const PUBLIC_REGISTRATION_ROLES = ["student", "faculty", "alumni"];

const initialAccountStatusForRole = (role) => (role === "student" ? "active" : "pending");

const registerUser = async (payload) => {

  const { role, username, email, password, identityId, fullName } = payload;
  if (!role || !username || !email || !password || !fullName) {
    throw ApiError.badRequest("Required registration fields missing");
  }
  if (!PUBLIC_REGISTRATION_ROLES.includes(role)) {
    throw ApiError.badRequest("Invalid role for public registration");
  }
  try {
    validatePassword(password);
  } catch (error) {
    throw ApiError.badRequest(error.message);
  }
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedIdentityId = identityId
    ? identityId.trim().toUpperCase()
    : null;
  const existingUser = await User.findOne({
    $or: [
      { username: normalizedUsername },
      { email: normalizedEmail },
      ...(normalizedIdentityId ? [{ identityId: normalizedIdentityId }] : [])
    ]
  });

  if (existingUser) {
    if (existingUser.username === normalizedUsername) {
      throw ApiError.conflict("Username already exists");
    }
    if (existingUser.email === normalizedEmail) {
      throw ApiError.conflict("Email already exists");
    }
    if (normalizedIdentityId && existingUser.identityId === normalizedIdentityId) {
      throw ApiError.conflict("Identity ID already exists");
    }
  }
  const user = new User({
    role,
    username: normalizedUsername,
    searchUsername: normalizedUsername,
    email: normalizedEmail,
    identityId: normalizedIdentityId,
    accountStatus: initialAccountStatusForRole(role)
  });

  await user.setPassword(password);
  try {
    await user.save();
    const profile = await Profile.create({
      userId: user._id,
      role,
      fullName,
      profileCompletion: 0,
      recommendationEnabled: false,
      visibility: "public",
      profileStatus: "active"
    });
    user.profileCreated = true;
    user.profileId = profile._id;
    await user.save();
    try {
      await syncUserIntelligence(user._id.toString());
    } catch (syncError) {
      logger.error("syncUserIntelligence failed after registration", syncError);
    }

    // Notification is fire-and-forget: notify() never throws, so it
    // cannot fail registration even if something inside it breaks.
    await notify(NOTIFICATION_EVENTS.USER_REGISTERED, {
      userId: user._id,
      data: { name: fullName },
      meta: { role: user.role }
    });

    return {
      success: true,
      message: "Account created successfully",
      data: {
        userId: user._id,
        profileId: profile._id,
        role: user.role,
        username: user.username,
        email: user.email,
        identityId: user.identityId,
        accountStatus: user.accountStatus,
        profileCreated: user.profileCreated,
        profileCompletion: profile.profileCompletion,
        recommendationEnabled: profile.recommendationEnabled
      }
    };

  } catch (error) {
    if (user._id) {
      await User.findByIdAndDelete(user._id).catch(() => {});
    }

    if (error.code === 11000) {
      throw ApiError.conflict("User already exists");
    }

    throw error;
  }
};

module.exports = { registerUser };
