// backend/src/modules/feed/routes/feed.routes.js
const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { feedActionLimiter, feedInteractionLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateCreatePost, validateEditPost, validatePostIdParam, validateFeedQuery,
  validateReactionType,
  validatePinPost,
  validateModeratePost
} = require("../validators/feedPost.validator");
const {
  validateCreateComment, validateEditComment, validatePostIdParam: validatePostIdParamForComments,
  validateCommentIdParam, validateCommentsQuery, validateModerateComment
} = require("../validators/feedComment.validator");
const {
  validateCreateReport, validateReportIdParam, validateReportsQuery, validateResolveReport
} = require("../validators/feedReport.validator");

const {
  createPostController, editPostController, deletePostController,
  toggleLikeController, getFeedController, getPostByIdController, getUserPostsController,
  togglePinController, moderatePostController
} = require("../controllers/feedPost.controller");
const {
  createCommentController, editCommentController, deleteCommentController,
  getCommentsController, getRepliesController, moderateCommentController
} = require("../controllers/feedComment.controller");
// NEW
const {
  reactController, reactToCommentController,
  getReactionSummaryController, getCommentReactionSummaryController,
  getMyReactionController, getMyCommentReactionController
} = require("../controllers/feedReaction.controller");
const {
  toggleBookmarkController, getMyBookmarksController
} = require("../controllers/feedBookmark.controller");
const {
  createReportController, getReportsController, resolveReportController
} = require("../controllers/feedReport.controller");

// ── Feed ─────────────────────────────────────────────────────────
router.get("/", authMiddleware, validateFeedQuery, getFeedController);
router.post("/", authMiddleware, feedActionLimiter, validateCreatePost, createPostController);

// ── Bookmarks (NEW) — before "/posts/:postId" style routes, own namespace ──
router.get("/bookmarks", authMiddleware, getMyBookmarksController);

router.post("/reports", authMiddleware, validateCreateReport, createReportController);

// UPGRADE: allowRoles("admin") added on both admin-report routes.
// Previously only authMiddleware guarded these — any authenticated user
// (student/faculty/alumni) could reach the controller, and got rejected
// only deep inside feedReport.service.js's isFeedAdmin() check, after
// query params were already parsed/validated. Route-level role guard now
// rejects non-admins immediately with a clean 403, before any further
// work happens. Service-level isFeedAdmin() check is left in place
// deliberately — defense-in-depth in case this service is ever called
// from somewhere else that skips the route guard.
router.get("/admin/reports", authMiddleware, allowRoles("admin"), validateReportsQuery, getReportsController);
router.patch(
  "/admin/reports/:reportId",
  authMiddleware,
  allowRoles("admin"),
  validateReportIdParam,
  validateResolveReport,
  resolveReportController
);

// ── Posts ────────────────────────────────────────────────────────
router.get("/posts/:postId", authMiddleware, validatePostIdParam, getPostByIdController);
router.patch("/posts/:postId", authMiddleware, validatePostIdParam, validateEditPost, editPostController);
router.delete("/posts/:postId", authMiddleware, validatePostIdParam, deletePostController);
router.post("/posts/:postId/like", authMiddleware, validatePostIdParam, toggleLikeController);
router.patch("/posts/:postId/pin", authMiddleware, validatePostIdParam, validatePinPost, togglePinController);
router.patch("/posts/:postId/moderate", authMiddleware, validatePostIdParam, validateModeratePost, moderatePostController);

// ── Reactions (NEW) — full emoji picker, separate from the quick "like" above ──
router.post(
  "/posts/:postId/react", authMiddleware, feedInteractionLimiter, validatePostIdParam, validateReactionType, reactController
);
router.get("/posts/:postId/reactions", authMiddleware, feedInteractionLimiter, validatePostIdParam, getReactionSummaryController);
router.get("/posts/:postId/my-reaction", authMiddleware, feedInteractionLimiter, validatePostIdParam, getMyReactionController);

// ── Bookmarks (NEW) — toggle lives under posts, list lives at /feed/bookmarks above ──
router.post("/posts/:postId/bookmark", authMiddleware, feedInteractionLimiter, validatePostIdParam, toggleBookmarkController);

// ── Profile activity ────────────────────────────────────────────
router.get("/users/:userId/posts", authMiddleware, getUserPostsController);

// ── Comments ─────────────────────────────────────────────────────
router.get(
  "/posts/:postId/comments", authMiddleware,
  validatePostIdParamForComments, validateCommentsQuery, getCommentsController
);
router.post(
  "/posts/:postId/comments", authMiddleware, feedActionLimiter,
  validatePostIdParamForComments, validateCreateComment, createCommentController
);
router.patch("/comments/:commentId", authMiddleware, validateCommentIdParam, validateEditComment, editCommentController);
router.delete("/comments/:commentId", authMiddleware, validateCommentIdParam, deleteCommentController);
router.get("/comments/:commentId/replies", authMiddleware, feedInteractionLimiter, validateCommentIdParam, getRepliesController);
router.patch(
  "/comments/:commentId/moderate",
  authMiddleware,
  validateCommentIdParam,
  validateModerateComment,
  moderateCommentController
);
router.post("/comments/:commentId/react", authMiddleware, feedInteractionLimiter, validateCommentIdParam, validateReactionType, reactToCommentController);
router.get("/comments/:commentId/reactions", authMiddleware, feedInteractionLimiter, validateCommentIdParam, getCommentReactionSummaryController);
router.get("/comments/:commentId/my-reaction", authMiddleware, feedInteractionLimiter, validateCommentIdParam, getMyCommentReactionController);

module.exports = router;