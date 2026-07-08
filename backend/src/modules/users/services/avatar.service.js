// backend/src/modules/users/services/avatar.service.js
//
// Dedicated avatar upload service — separate file from profile.service.js
// on purpose. profile.service.js's updateProfile() only ever writes
// already-known string fields (it has no idea what Cloudinary is); a
// direct file upload is a different concern (validation, Cloudinary call,
// old-file cleanup) and deserves its own service, the same way Resume
// has its own resume.service.js instead of living inside profile.service.js.
//
// Pattern copied from resume.service.js's upload flow: validate → upload
// to Cloudinary via the shared media layer → persist metadata → run
// syncUserIntelligence (avatar affects profileCompletion, same as any
// other profile field a user fills in).

const Profile = require("../models/Profile");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const { uploadMedia, replaceMedia, deleteMedia } = require("../../../shared/media/media.service");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const ApiError = require("../../../shared/errors/ApiError");

const uploadAvatar = async (userId, file) => {
  if (!file || !file.buffer) {
    throw ApiError.validation("Avatar image is required");
  }

  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound("Profile not found");
  }

  const { buffer, mimetype: mimeType, size: sizeInBytes, originalname: originalName } = file;

  // replaceMedia() uploads the new image first, then deletes the old
  // Cloudinary object only after the new one succeeds — avoids leaving
  // a user with no avatar at all if the new upload fails midway.
  const uploaded = profile.avatarPublicId
    ? await replaceMedia(
        MEDIA_TYPES.AVATAR,
        userId,
        { buffer, mimeType, sizeInBytes, originalName },
        profile.avatarPublicId
      )
    : await uploadMedia(MEDIA_TYPES.AVATAR, userId, { buffer, mimeType, sizeInBytes, originalName });

  profile.avatar = uploaded.url;
  profile.avatarPublicId = uploaded.publicId;
  profile.lastActiveAt = new Date();
  await profile.save();

  const syncResult = await syncUserIntelligence(userId);

  return {
    success: true,
    message: "Avatar uploaded successfully",
    data: {
      avatar: profile.avatar,
      profileCompletion: syncResult.totalCompletion,
      recommendationEnabled: syncResult.recommendationEnabled
    }
  };
};

const deleteAvatar = async (userId) => {
  const profile = await Profile.findOne({ userId });
  if (!profile) {
    throw ApiError.notFound("Profile not found");
  }
  if (!profile.avatarPublicId) {
    throw ApiError.badRequest("No avatar to remove");
  }

  await deleteMedia(MEDIA_TYPES.AVATAR, profile.avatarPublicId);
  profile.avatar = "";
  profile.avatarPublicId = "";
  await profile.save();

  const syncResult = await syncUserIntelligence(userId);

  return {
    success: true,
    message: "Avatar removed successfully",
    data: {
      profileCompletion: syncResult.totalCompletion,
      recommendationEnabled: syncResult.recommendationEnabled
    }
  };
};

module.exports = { uploadAvatar, deleteAvatar };