// backend/src/modules/feed/routes/feed.routes.js
const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../../shared/middlewares/auth.middleware");
const { feedActionLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateCreatePost, validateEditPost, validatePostIdParam, validateFeedQuery
} = require("../validators/feedPost.validator");
const {
  validateCreateComment, validateEditComment, validatePostIdParam: validatePostIdParamForComments,
  validateCommentIdParam, validateCommentsQuery
} = require("../validators/feedComment.validator");

const {
  createPostController, editPostController, deletePostController,
  toggleLikeController, getFeedController, getPostByIdController, getUserPostsController
} = require("../controllers/feedPost.controller");
const {
  createCommentController, editCommentController, deleteCommentController,
  getCommentsController, getRepliesController
} = require("../controllers/feedComment.controller");

// ── Feed ─────────────────────────────────────────────────────────
router.get("/", authMiddleware, validateFeedQuery, getFeedController);
router.post("/", authMiddleware, feedActionLimiter, validateCreatePost, createPostController);

// ── Posts ────────────────────────────────────────────────────────
router.get("/posts/:postId", authMiddleware, validatePostIdParam, getPostByIdController);
router.patch("/posts/:postId", authMiddleware, validatePostIdParam, validateEditPost, editPostController);
router.delete("/posts/:postId", authMiddleware, validatePostIdParam, deletePostController);
router.post("/posts/:postId/like", authMiddleware, validatePostIdParam, toggleLikeController);

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
router.get("/comments/:commentId/replies", authMiddleware, validateCommentIdParam, getRepliesController);

module.exports = router;