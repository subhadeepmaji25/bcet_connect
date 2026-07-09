// backend/src/modules/feed/controllers/feedComment.controller.js
const feedCommentService = require("../services/feedComment.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createCommentController = asyncHandler(async (req, res) => {
  const result = await feedCommentService.createComment(req.user.id, req.params.postId, req.body);
  logger.info("Feed comment created", { module: "Feed", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const editCommentController = asyncHandler(async (req, res) => {
  const result = await feedCommentService.editComment(req.user.id, req.params.commentId, req.body.content);
  return sendResponse(res, result);
});

const deleteCommentController = asyncHandler(async (req, res) => {
  const result = await feedCommentService.deleteComment(req.user.id, req.params.commentId);
  return sendResponse(res, result);
});

const getCommentsController = asyncHandler(async (req, res) => {
  const result = await feedCommentService.getComments(req.params.postId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Comments fetched successfully",
    data: { comments: result.comments },
    meta: { nextCursor: result.nextCursor }
  });
});

const getRepliesController = asyncHandler(async (req, res) => {
  const replies = await feedCommentService.getReplies(req.params.commentId);
  return sendResponse(res, { success: true, message: "Replies fetched successfully", data: { replies } });
});

module.exports = {
  createCommentController, editCommentController, deleteCommentController, getCommentsController, getRepliesController
};