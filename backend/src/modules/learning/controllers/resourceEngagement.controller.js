// backend/src/modules/learning/controllers/resourceEngagement.controller.js
//
// NEW MODULE — Learning (Academic Learning domain, Phase 3).
// Thin layer, identical shape to resource.controller.js/subject.controller.js
// — asyncHandler wrap, sendResponse envelope, no business logic here.

const engagementService = require("../services/resourceEngagement.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

// ── Bookmarks ───────────────────────────────────────────────────────
const toggleBookmarkController = asyncHandler(async (req, res) => {
  const result = await engagementService.toggleBookmark(req.user.id, req.user.role, req.params.resourceId);
  return sendResponse(res, result);
});

const getMyBookmarksController = asyncHandler(async (req, res) => {
  const result = await engagementService.getMyBookmarks(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Bookmarks fetched successfully",
    data: { resources: result.resources },
    meta: { nextCursor: result.nextCursor }
  });
});

// ── Ratings ─────────────────────────────────────────────────────────
const rateResourceController = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const result = await engagementService.rateResource(req.user.id, req.user.role, req.params.resourceId, rating, review);
  logger.info("Resource rated", { module: "Learning", userId: req.user.id, resourceId: req.params.resourceId, rating });
  return sendResponse(res, result);
});

const getMyRatingController = asyncHandler(async (req, res) => {
  const rating = await engagementService.getMyRating(req.user.id, req.params.resourceId);
  return sendResponse(res, { success: true, message: "Your rating fetched", data: { rating } });
});

const getResourceRatingsController = asyncHandler(async (req, res) => {
  const result = await engagementService.getResourceRatings(req.params.resourceId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Ratings fetched successfully",
    data: { ratings: result.ratings },
    meta: { pagination: result.pagination }
  });
});

// ── Comments ────────────────────────────────────────────────────────
const createCommentController = asyncHandler(async (req, res) => {
  const result = await engagementService.createComment(req.user.id, req.user.role, req.params.resourceId, req.body);
  return sendResponse(res, { statusCode: 201, ...result });
});

const editCommentController = asyncHandler(async (req, res) => {
  const result = await engagementService.editComment(req.user.id, req.params.commentId, req.body.content);
  return sendResponse(res, result);
});

const deleteCommentController = asyncHandler(async (req, res) => {
  const result = await engagementService.deleteComment(req.user.id, req.user.role, req.params.commentId);
  logger.info("Comment deleted", { module: "Learning", userId: req.user.id, commentId: req.params.commentId });
  return sendResponse(res, result);
});

const getCommentsController = asyncHandler(async (req, res) => {
  const result = await engagementService.getComments(req.user.id, req.user.role, req.params.resourceId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Comments fetched successfully",
    data: { comments: result.comments },
    meta: { nextCursor: result.nextCursor }
  });
});

const getRepliesController = asyncHandler(async (req, res) => {
  const replies = await engagementService.getReplies(req.params.commentId);
  return sendResponse(res, { success: true, message: "Replies fetched successfully", data: { replies } });
});

const toggleCommentLikeController = asyncHandler(async (req, res) => {
  const result = await engagementService.toggleCommentLike(req.user.id, req.params.commentId);
  return sendResponse(res, result);
});

// ── Downloads ───────────────────────────────────────────────────────
const trackDownloadController = asyncHandler(async (req, res) => {
  const result = await engagementService.trackDownload(req.user.id, req.user.role, req.params.resourceId);
  return sendResponse(res, result);
});

module.exports = {
  toggleBookmarkController,
  getMyBookmarksController,
  rateResourceController,
  getMyRatingController,
  getResourceRatingsController,
  createCommentController,
  editCommentController,
  deleteCommentController,
  getCommentsController,
  getRepliesController,
  toggleCommentLikeController,
  trackDownloadController
};
