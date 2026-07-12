// backend/src/modules/learning/routes/learning.routes.js
//
// Mounted in routes/index.js as /learning (last, most-dependent module —
// relies on Users/Profile for semester/section/isCR, Notification for
// resource/rating/comment/discussion events, and Jobs for
// LearningPath.careerTrack's JOB_CATEGORIES reuse). Notification events
// for this module (RESOURCE_PUBLISHED/PENDING_VERIFICATION/VERIFIED/
// REJECTED/RATED/COMMENT_RECEIVED, SUBJECT_DISCUSSION_ANSWERED) are
// wired in notification.constants.js.

const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { createUploadMiddleware } = require("../../../shared/middlewares/upload.middleware");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const { uploadLimiter, jobActionLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateCreateSubject, validateUpdateSubject, validateSubjectIdParam, validateListSubjectsQuery
} = require("../validators/subject.validator");

const {
  validateUploadResource, validateVerifyResource, validateResourceIdParam, validateListResourcesQuery
} = require("../validators/resource.validator");

const {
  validateResourceIdParam: validateEngagementResourceIdParam,
  validateCommentIdParam, validateRateResource, validateCreateComment, validateEditComment, validateCursorQuery
} = require("../validators/resourceEngagement.validator");

const {
  validateResourceIdParam: validateProgressResourceIdParam,
  validateUpdateProgress, validateContinueLearningQuery
} = require("../validators/learningProgress.validator");

const {
  validatePathIdParam, validateCreatePath, validateUpdatePath, validateListPathsQuery,
  validateStepIdParam, validateUpdateStepProgress // NEW (Phase 4)
} = require("../validators/learningPath.validator");

const {
  validateSubjectIdParam: validateDiscussionSubjectIdParam,
  validateDiscussionIdParam, validateCreateDiscussion, validateEditDiscussion,
  validateCursorQuery: validateDiscussionCursorQuery
} = require("../validators/subjectDiscussion.validator");

const {
  createSubjectController, updateSubjectController, archiveSubjectController,
  listSubjectsController, getMySubjectsController, getSubjectByIdController
} = require("../controllers/subject.controller");

const {
  uploadResourceController, verifyResourceController, listResourcesController,
  listPendingResourcesController, getMyUploadsController, getResourceByIdController, deleteResourceController
} = require("../controllers/resource.controller");

const {
  toggleBookmarkController, getMyBookmarksController, rateResourceController, getMyRatingController,
  getResourceRatingsController, createCommentController, editCommentController, deleteCommentController,
  getCommentsController, getRepliesController, toggleCommentLikeController, trackDownloadController
} = require("../controllers/resourceEngagement.controller");

const {
  markAsOpenedController, updateProgressController, getMyProgressController,
  getContinueLearningController, getResourceProgressStatsController
} = require("../controllers/learningProgress.controller");

const {
  createPathController, updatePathController, publishPathController, archivePathController,
  listPathsController, getMyPathsController, getPathByIdController,
  enrollInPathController, updateStepProgressController, getMyPathProgressController // NEW (Phase 4)
} = require("../controllers/learningPath.controller");

const {
  createDiscussionController, editDiscussionController, deleteDiscussionController,
  getQuestionsController, getAnswersController, acceptAnswerController,
  togglePinController, toggleLikeController
} = require("../controllers/subjectDiscussion.controller");

const {
  getSubjectAnalyticsController, getFacultyOverviewController, getMyLearningStatsController
} = require("../controllers/learningAnalytics.controller");

const resourceUpload = createUploadMiddleware(MEDIA_TYPES.LEARNING_RESOURCE, { storage: "memory", fieldName: "file" });

// ── Subjects ─────────────────────────────────────────────────────────
router.get("/subjects", authMiddleware, validateListSubjectsQuery, listSubjectsController);
router.get("/subjects/mine", authMiddleware, allowRoles("faculty", "admin"), getMySubjectsController);
router.post("/subjects", authMiddleware, allowRoles("faculty", "admin"), jobActionLimiter, validateCreateSubject, createSubjectController);
router.patch("/subjects/:subjectId", authMiddleware, allowRoles("faculty", "admin"), validateSubjectIdParam, validateUpdateSubject, updateSubjectController);
router.delete("/subjects/:subjectId", authMiddleware, allowRoles("faculty", "admin"), validateSubjectIdParam, archiveSubjectController);

// Subject-scoped analytics/discussion — static, BEFORE "/subjects/:subjectId".
router.get("/subjects/:subjectId/analytics", authMiddleware, allowRoles("faculty", "admin"), validateSubjectIdParam, getSubjectAnalyticsController);
router.get("/subjects/:subjectId/discussions", authMiddleware, validateDiscussionSubjectIdParam, validateDiscussionCursorQuery, getQuestionsController);
router.post("/subjects/:subjectId/discussions", authMiddleware, validateDiscussionSubjectIdParam, validateCreateDiscussion, createDiscussionController);

router.get("/subjects/:subjectId", authMiddleware, validateSubjectIdParam, getSubjectByIdController);

// ── Discussions (Q&A) ───────────────────────────────────────────────
router.get("/discussions/:discussionId/answers", authMiddleware, validateDiscussionIdParam, getAnswersController);
router.patch("/discussions/:discussionId", authMiddleware, validateDiscussionIdParam, validateEditDiscussion, editDiscussionController);
router.delete("/discussions/:discussionId", authMiddleware, validateDiscussionIdParam, deleteDiscussionController);
router.post("/discussions/:discussionId/accept", authMiddleware, validateDiscussionIdParam, acceptAnswerController);
router.post("/discussions/:discussionId/pin", authMiddleware, allowRoles("faculty", "admin"), validateDiscussionIdParam, togglePinController);
router.post("/discussions/:discussionId/like", authMiddleware, validateDiscussionIdParam, toggleLikeController);

// ── Resources — core CRUD (Phase 1) ─────────────────────────────────
router.get("/resources", authMiddleware, validateListResourcesQuery, listResourcesController);
router.get("/resources/mine", authMiddleware, getMyUploadsController);
router.get("/resources/pending", authMiddleware, allowRoles("faculty", "admin"), listPendingResourcesController);
router.get("/resources/bookmarks", authMiddleware, validateCursorQuery, getMyBookmarksController);
router.get("/resources/continue-learning", authMiddleware, validateContinueLearningQuery, getContinueLearningController);

router.post("/resources", authMiddleware, allowRoles("student", "faculty", "admin"), uploadLimiter, resourceUpload, validateUploadResource, uploadResourceController);
router.patch("/resources/:resourceId/verify", authMiddleware, allowRoles("faculty", "admin"), validateResourceIdParam, validateVerifyResource, verifyResourceController);
router.delete("/resources/:resourceId", authMiddleware, validateResourceIdParam, deleteResourceController);
router.get("/resources/:resourceId", authMiddleware, validateResourceIdParam, getResourceByIdController);

// ── Resources — engagement (Phase 3) ────────────────────────────────
router.post("/resources/:resourceId/bookmark", authMiddleware, validateEngagementResourceIdParam, toggleBookmarkController);
router.post("/resources/:resourceId/rate", authMiddleware, validateEngagementResourceIdParam, validateRateResource, rateResourceController);
router.get("/resources/:resourceId/rating/mine", authMiddleware, validateEngagementResourceIdParam, getMyRatingController);
router.get("/resources/:resourceId/ratings", authMiddleware, validateEngagementResourceIdParam, getResourceRatingsController);
router.post("/resources/:resourceId/download", authMiddleware, validateEngagementResourceIdParam, trackDownloadController);
router.get("/resources/:resourceId/comments", authMiddleware, validateEngagementResourceIdParam, validateCursorQuery, getCommentsController);
router.post("/resources/:resourceId/comments", authMiddleware, validateEngagementResourceIdParam, validateCreateComment, createCommentController);
router.get("/comments/:commentId/replies", authMiddleware, validateCommentIdParam, getRepliesController);
router.patch("/comments/:commentId", authMiddleware, validateCommentIdParam, validateEditComment, editCommentController);
router.delete("/comments/:commentId", authMiddleware, validateCommentIdParam, deleteCommentController);
router.post("/comments/:commentId/like", authMiddleware, validateCommentIdParam, toggleCommentLikeController);

// ── Resources — progress (Phase 4) ──────────────────────────────────
router.post("/resources/:resourceId/progress/open", authMiddleware, validateProgressResourceIdParam, markAsOpenedController);
router.patch("/resources/:resourceId/progress", authMiddleware, validateProgressResourceIdParam, validateUpdateProgress, updateProgressController);
router.get("/resources/:resourceId/progress/mine", authMiddleware, validateProgressResourceIdParam, getMyProgressController);
router.get("/resources/:resourceId/progress/stats", authMiddleware, allowRoles("admin"), validateProgressResourceIdParam, getResourceProgressStatsController);

// ── Learning Paths (Phase 5, Career Learning) ───────────────────────
router.get("/paths", authMiddleware, validateListPathsQuery, listPathsController);
router.get("/paths/mine", authMiddleware, allowRoles("faculty", "admin"), getMyPathsController);
router.post("/paths", authMiddleware, allowRoles("faculty", "admin"), validateCreatePath, createPathController);
router.patch("/paths/:pathId", authMiddleware, allowRoles("faculty", "admin"), validatePathIdParam, validateUpdatePath, updatePathController);
router.post("/paths/:pathId/publish", authMiddleware, allowRoles("faculty", "admin"), validatePathIdParam, publishPathController);
router.delete("/paths/:pathId", authMiddleware, allowRoles("faculty", "admin"), validatePathIdParam, archivePathController);

// ── Learning Paths — enrollment & step progress (Phase 4) ───────────
// Student-facing — no allowRoles() restriction beyond authMiddleware,
// same "any authenticated role may track their own progress" openness
// resources/:resourceId/progress/* routes below already allow (Faculty/
// Admin browsing a career path and tracking it for themselves is not
// harmful, unlike publish/archive which stay Faculty/Admin-only above).
// Static "/steps/:stepId/progress" and "/progress/mine" segments never
// collide with the bare "/paths/:pathId" routes above/below them —
// different segment counts, so registration order here doesn't matter,
// same reasoning already noted for "/skills/bulk" vs "/skills/:skillId"
// in user.routes.js.
router.post("/paths/:pathId/enroll", authMiddleware, validatePathIdParam, enrollInPathController);
router.patch("/paths/:pathId/steps/:stepId/progress", authMiddleware, validateStepIdParam, validateUpdateStepProgress, updateStepProgressController);
router.get("/paths/:pathId/progress/mine", authMiddleware, validatePathIdParam, getMyPathProgressController);

router.get("/paths/:pathId", authMiddleware, validatePathIdParam, getPathByIdController);

// ── Analytics (Phase 5) ─────────────────────────────────────────────
router.get("/analytics/mine", authMiddleware, getMyLearningStatsController);
router.get("/analytics/faculty-overview", authMiddleware, allowRoles("faculty", "admin"), getFacultyOverviewController);

module.exports = router;