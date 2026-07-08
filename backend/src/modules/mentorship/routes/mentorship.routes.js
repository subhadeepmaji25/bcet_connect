// backend/src/modules/mentorship/routes/mentorship.routes.js
const express = require("express");
const router = express.Router();

const { authMiddleware, optionalAuthMiddleware } = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { mentorshipRequestLimiter } = require("../../../shared/security/rateLimiters");

const { validateBecomeMentor, validateUpdateMentorProfile, validateUpdateVisibility } = require("../validators/mentorProfile.validator");
const { validateCreateRequest, validateAcceptRequest, validateRejectRequest, validateCancelRequest } = require("../validators/mentorRequest.validator");
const { validateScheduleSession, validateCancelSession } = require("../validators/mentorSession.validator");
const { validateCreateReview } = require("../validators/mentorReview.validator");

const {
  becomeMentorController,
  getMyMentorProfileController,
  updateMentorProfileController,
  updateProfileVisibilityController,
  deactivateMentorProfileController,
  reactivateMentorProfileController,
  getPublicMentorProfileController,
  verifyMentorController,
  listMentorsController,
  getVerifiedMentorsController,
  getTopMentorsController
} = require("../controllers/mentorProfile.controller");

const {
  createRequestController,
  acceptRequestController,
  rejectRequestController,
  cancelRequestController,
  getMyRequestsController,
  getReceivedRequestsController,
  getRequestByIdController
} = require("../controllers/mentorRequest.controller");

const {
  scheduleSessionController,
  completeSessionController,
  cancelSessionController,
  getMySessionsController,
  getSessionByIdController
} = require("../controllers/mentorSession.controller");

const { createReviewController, getMentorReviewsController } = require("../controllers/mentorReview.controller");
const { MENTOR_ELIGIBLE_ROLES, MENTORSHIP_REQUESTER_ROLES } = require("../constants/mentor.constants");

router.get("/mentors", optionalAuthMiddleware, listMentorsController);
router.get("/mentors/verified", optionalAuthMiddleware, getVerifiedMentorsController);
router.get("/mentors/top", optionalAuthMiddleware, getTopMentorsController);

router.post("/profile", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), mentorshipRequestLimiter, validateBecomeMentor, becomeMentorController);
router.get("/profile/me", authMiddleware, getMyMentorProfileController);
router.patch("/profile", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), validateUpdateMentorProfile, updateMentorProfileController);
router.patch("/profile/visibility", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), validateUpdateVisibility, updateProfileVisibilityController);
router.delete("/profile", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), deactivateMentorProfileController);
router.patch("/profile/reactivate", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), reactivateMentorProfileController);
router.patch("/profile/:mentorId/verify", authMiddleware, allowRoles("admin"), verifyMentorController);
router.get("/profile/:mentorId", optionalAuthMiddleware, getPublicMentorProfileController);

router.post("/requests", authMiddleware, allowRoles(...MENTORSHIP_REQUESTER_ROLES), mentorshipRequestLimiter, validateCreateRequest, createRequestController);
router.get("/requests", authMiddleware, getMyRequestsController);
router.get("/requests/received", authMiddleware, getReceivedRequestsController);
router.patch("/requests/:requestId/accept", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), validateAcceptRequest, acceptRequestController);
router.patch("/requests/:requestId/reject", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), validateRejectRequest, rejectRequestController);
router.patch("/requests/:requestId/cancel", authMiddleware, validateCancelRequest, cancelRequestController);
router.get("/requests/:requestId", authMiddleware, getRequestByIdController);

router.post("/sessions", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), mentorshipRequestLimiter, validateScheduleSession, scheduleSessionController);
router.patch("/sessions/:sessionId/complete", authMiddleware, allowRoles(...MENTOR_ELIGIBLE_ROLES), completeSessionController);
router.patch("/sessions/:sessionId/cancel", authMiddleware, validateCancelSession, cancelSessionController);
router.get("/sessions", authMiddleware, getMySessionsController);
router.get("/sessions/:sessionId", authMiddleware, getSessionByIdController);

router.post(
  "/sessions/:sessionId/review",
  authMiddleware,
  allowRoles(...MENTORSHIP_REQUESTER_ROLES),
  mentorshipRequestLimiter,
  validateCreateReview,
  createReviewController
);

router.get("/mentors/:mentorId/reviews", getMentorReviewsController);

module.exports = router;