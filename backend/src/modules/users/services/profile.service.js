// backend/src/modules/users/services/profile.service.js
//
// NOTE on this update: no changes needed in this file for PROFILE_COMPLETED.
// That event is fired from a single, central place — engines/user-sync/
// syncUserIntelligence.js — not duplicated here or in skill/education/
// experience/project/resume.service.js. This file already calls
// syncUserIntelligence(userId) below, so it automatically gets the new
// behavior for free. Keeping notify() out of this file is intentional:
// if it lived here, the same few lines would need to be copy-pasted into
// the other 5 user-services too, which is exactly the duplication the
// sync layer was built to avoid.

const Profile = require("../models/Profile");
const ApiError = require("../../../shared/errors/ApiError");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");

const ALLOWED_PROFILE_FIELDS = ["fullName","headline","bio","avatar","avatarPublicId","coverImage","coverImagePublicId","branch","department","currentYear","passoutYear","currentCompany","currentRole","location","interests","searchableSkills","socialLinks","visibility","isMentor"];

const updateProfile = async (userId, payload) => {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound("Profile not found");
  }
  ALLOWED_PROFILE_FIELDS.forEach(field => {
    if (payload[field] !== undefined) {
      profile[field] = payload[field];
    }
  });
  profile.lastActiveAt = new Date();
  await profile.save();

  // syncUserIntelligence() internally recalculates completion, rebuilds
  // the search profile, and — if this update just pushed completion to
  // 100% for the first time — fires PROFILE_COMPLETED. Nothing to do here.
  const syncResult = await syncUserIntelligence(userId);

  return { success: true, message: "Profile updated successfully", data: { profile, profileCompletion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled, breakdown: syncResult.breakdown } };
};

const getProfileByUserId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound("Profile not found");
  }
  return profile;
};

const LIMITED_PROFILE_FIELDS = ["userId", "fullName", "headline", "avatar", "visibility"];

const projectProfileByVisibility = (profile, isSelf, isConnected) => {
  if (profile.visibility !== "private" || isSelf || isConnected) return profile;

  const plain = typeof profile.toObject === "function" ? profile.toObject() : profile;
  const limited = {};
  for (const field of LIMITED_PROFILE_FIELDS) {
    if (plain[field] !== undefined) limited[field] = plain[field];
  }
  limited.isLimitedProfile = true; // explicit — frontend shows "Private profile — connect to view more"
  return limited;
};

const getPublicProfile = async (viewerId, targetUserId) => {
  const profile = await Profile.findOne({ userId: targetUserId });
  if (!profile) {
    throw ApiError.notFound("Profile not found");
  }

  const isSelf = Boolean(viewerId) && viewerId.toString() === targetUserId.toString();

  let connectionStatus = null;
  let isConnected = false;
  if (viewerId && !isSelf) {
    const connectionService = require("../../connections/services/connection.service");
    connectionStatus = await connectionService.getConnectionStatus(viewerId, targetUserId);
    isConnected = connectionStatus === "connected";
  }

  const resultProfile = projectProfileByVisibility(profile, isSelf, isConnected);

  return { profile: resultProfile, connectionStatus };
};

const updateLastActive = async (userId) => {
  await Profile.updateOne({ userId }, { $set: { lastActiveAt: new Date() } });
};

module.exports = { updateProfile, getProfileByUserId, getPublicProfile, updateLastActive };