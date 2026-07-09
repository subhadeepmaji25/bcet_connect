// backend/src/modules/feed/controllers/feedReaction.controller.js
//
// Exposes the multi-emoji reaction picker. Distinct from
// feedPost.controller.js's toggleLikeController, which stays as the
// simple "just like it" path (calls the SAME react() service function
// with type=LIKE) — this controller is for the full picker UI.
const feedReactionService = require("../services/feedReaction.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const reactController = asyncHandler(async (req, res) => {
  const result = await feedReactionService.react(req.user.id, req.params.postId, req.body.type);
  return sendResponse(res, result);
});

const reactToCommentController = asyncHandler(async (req, res) => {
  const result = await feedReactionService.reactToComment(req.user.id, req.params.commentId, req.body.type);
  return sendResponse(res, result);
});

const getReactionSummaryController = asyncHandler(async (req, res) => {
  const summary = await feedReactionService.getReactionSummary(req.params.postId);
  return sendResponse(res, {
    success: true,
    message: "Reaction summary fetched successfully",
    data: { summary }
  });
});

const getCommentReactionSummaryController = asyncHandler(async (req, res) => {
  const summary = await feedReactionService.getCommentReactionSummary(req.params.commentId);
  return sendResponse(res, {
    success: true,
    message: "Comment reaction summary fetched successfully",
    data: { summary }
  });
});

const getMyReactionController = asyncHandler(async (req, res) => {
  const type = await feedReactionService.getMyReaction(req.user.id, req.params.postId);
  return sendResponse(res, {
    success: true,
    message: "Reaction fetched successfully",
    data: { type }
  });
});

const getMyCommentReactionController = asyncHandler(async (req, res) => {
  const type = await feedReactionService.getMyCommentReaction(req.user.id, req.params.commentId);
  return sendResponse(res, {
    success: true,
    message: "Comment reaction fetched successfully",
    data: { type }
  });
});

module.exports = {
  reactController,
  reactToCommentController,
  getReactionSummaryController,
  getCommentReactionSummaryController,
  getMyReactionController,
  getMyCommentReactionController
};
