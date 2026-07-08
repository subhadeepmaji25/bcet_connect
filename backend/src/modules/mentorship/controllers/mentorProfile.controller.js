// backend/src/modules/mentorship/controllers/mentorProfile.controller.js
const mentorProfileService = require("../services/mentorProfile.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const becomeMentorController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.becomeMentor(req.user.id, req.user.role, req.body);
  logger.info("Mentor profile created", { module: "Mentorship", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const getMyMentorProfileController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.getMyMentorProfile(req.user.id);
  return sendResponse(res, result);
});

const updateMentorProfileController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.updateMentorProfile(req.user.id, req.body);
  logger.info("Mentor profile updated", { module: "Mentorship", userId: req.user.id });
  return sendResponse(res, result);
});

// NEW — public/private toggle, mentorship-specific
const updateProfileVisibilityController = asyncHandler(async (req, res) => {
  const { visibility } = req.body;
  const result = await mentorProfileService.updateProfileVisibility(req.user.id, visibility);
  logger.info("Mentor profile visibility updated", {
    module: "Mentorship", userId: req.user.id, visibility
  });
  return sendResponse(res, result);
});

const deactivateMentorProfileController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.deactivateMentorProfile(req.user.id);
  logger.info("Mentor profile deactivated", { module: "Mentorship", userId: req.user.id });
  return sendResponse(res, result);
});

const reactivateMentorProfileController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.reactivateMentorProfile(req.user.id);
  logger.info("Mentor profile reactivated", { module: "Mentorship", userId: req.user.id });
  return sendResponse(res, result);
});

// FIXED — ab optionalAuthMiddleware route pe lagega (routes file dekho),
// isliye req.user login hone par populate hoga, na hone par bhi route block nahi hoga.
const getPublicMentorProfileController = asyncHandler(async (req, res) => {
  const viewerId = req.user?.id || null;
  const result = await mentorProfileService.getPublicMentorProfile(req.params.mentorId, viewerId);
  return sendResponse(res, result);
});

const verifyMentorController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.verifyMentor(req.params.mentorId, req.user.id);
  logger.info("Mentor verified", { module: "Mentorship", adminId: req.user.id, mentorId: req.params.mentorId });
  return sendResponse(res, result);
});

const listMentorsController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.listMentors(req.query, req.user?.id || null);
  return sendResponse(res, {
    success: true,
    message: "Mentors fetched successfully",
    data: { mentors: result.mentors },
    meta: { pagination: result.pagination },
  });
});

const getVerifiedMentorsController = asyncHandler(async (req, res) => {
  const result = await mentorProfileService.getVerifiedMentors(req.query);
  return sendResponse(res, {
    success: true,
    message: "Verified mentors fetched successfully",
    data: { mentors: result.mentors },
    meta: { pagination: result.pagination },
  });
});

const getTopMentorsController = asyncHandler(async (req, res) => {
  const mentors = await mentorProfileService.getTopMentors(req.query, req.user?.id || null);
  return sendResponse(res, {
    success: true,
    message: "Top mentors fetched successfully",
    data: { mentors },
  });
});

module.exports = {
  becomeMentorController,
  getMyMentorProfileController,
  updateMentorProfileController,
  updateProfileVisibilityController, // NEW
  deactivateMentorProfileController,
  reactivateMentorProfileController,
  getPublicMentorProfileController,
  verifyMentorController,
  listMentorsController,
  getVerifiedMentorsController,
  getTopMentorsController,
};
