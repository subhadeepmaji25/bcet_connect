// backend/src/modules/users/services/profile.service.js
//
// NOTE: no changes needed for PROFILE_COMPLETED — that event fires from
// engines/user-sync/syncUserIntelligence.js, called below via
// syncUserIntelligence(userId). Not duplicated here.
//
// FIXED getPublicProfile(): getConnectionStatus() returns an OBJECT
// ({ status, requestId? }), not a bare string. isConnected used to
// compare the whole object against the literal string "connected",
// which is never true — so a genuinely connected viewer was always
// treated as NOT connected, and got shown the same limited/locked
// profile card as a stranger for any private-visibility profile.

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
    const { RELATIONSHIP_STATUS } = require("../../connections/constants/connection.constants");
    const result = await connectionService.getConnectionStatus(viewerId, targetUserId);
    connectionStatus = result.status; // FIXED — unwrap the object to the plain status string
    isConnected = connectionStatus === RELATIONSHIP_STATUS.CONNECTED;
  }

  const resultProfile = projectProfileByVisibility(profile, isSelf, isConnected);

  return { profile: resultProfile, connectionStatus };
};

const updateLastActive = async (userId) => {
  await Profile.updateOne({ userId }, { $set: { lastActiveAt: new Date() } });
};

module.exports = { updateProfile, getProfileByUserId, getPublicProfile, updateLastActive };