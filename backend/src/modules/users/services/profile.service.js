// backend/src/modules/users/services/profile.service.js
//
// NEW (Phase 1a): setCRStatus() — the missing write-side of isCR.
// Profile.js/profile.validator.js already correctly EXCLUDE isCR from
// student-editable fields (see file header comments in both). But
// excluding a write path only protects the field — it doesn't create
// the legitimate write path a Faculty/Admin actually needs. Without
// this function, resolveUploaderRole() in resource.service.js can read
// isCR but nobody can ever set it to true, so the entire CR-upload
// pathway is unreachable in practice. This closes that gap.

const Profile = require("../models/Profile");
const ApiError = require("../../../shared/errors/ApiError");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");

const ALLOWED_PROFILE_FIELDS = ["fullName","headline","bio","avatar","avatarPublicId","coverImage","coverImagePublicId","branch","department","currentYear","passoutYear","currentCompany","currentRole","location","interests","searchableSkills","socialLinks","visibility","isMentor","semester","section"];

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

// ── NEW (Phase 1a) ────────────────────────────────────────────────
//
// actingUserId/actingUserRole = the Faculty/Admin making the request
// (already role-gated at the route layer via allowRoles("faculty","admin")
// — this function does NOT re-check role, same trust boundary
// resource.service.js's verifyResource() keeps toward its own route
// guard). targetUserId = the student being granted/revoked CR status.
//
// Deliberately does NOT restrict Faculty to only their "own" department
// students — Faculty in this codebase are not scoped to a single
// department anywhere else (Subject.facultyId has no department-match
// enforcement either), so adding that restriction here would be an
// inconsistent, one-off rule. Admin and Faculty are treated identically
// for this action, same as verifyResource()'s "userRole !== admin"
// branch already does for Faculty-vs-Admin parity.
const setCRStatus = async (targetUserId, isCR) => {
  const targetProfile = await Profile.findOne({ userId: targetUserId });
  if (!targetProfile) {
    throw ApiError.notFound("Student profile not found");
  }

  if (targetProfile.role !== "student") {
    throw ApiError.badRequest("Only a student can be granted CR status");
  }

  targetProfile.isCR = Boolean(isCR);
  await targetProfile.save();

  return {
    success: true,
    message: isCR ? "Student marked as Class Representative" : "CR status removed",
    data: { profile: targetProfile }
  };
};

module.exports = { updateProfile, getProfileByUserId, getPublicProfile, updateLastActive, setCRStatus };