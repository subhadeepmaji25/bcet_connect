// backend/src/modules/communities/controllers/communityComment.controller.js
const communityCommentService = require("../services/communityComment.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createCommentController = asyncHandler(async (req, res) => {
  const result = await communityCommentService.createComment(req.user.id, req.params.postId, req.body);
  logger.info("Comment added", { module: "Communities", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const editCommentController = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const result = await communityCommentService.editComment(req.user.id, req.params.commentId, content);
  logger.info("Comment edited", { module: "Communities", userId: req.user.id, commentId: req.params.commentId });
  return sendResponse(res, result);
});

const deleteCommentController = asyncHandler(async (req, res) => {
  const result = await communityCommentService.deleteComment(req.user.id, req.params.commentId);
  logger.info("Comment deleted", { module: "Communities", userId: req.user.id, commentId: req.params.commentId });
  return sendResponse(res, result);
});

const getCommentsController = asyncHandler(async (req, res) => {
  const result = await communityCommentService.getComments(req.params.postId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Comments fetched successfully",
    data: { comments: result.comments },
    meta: { nextCursor: result.nextCursor }
  });
});

const getRepliesController = asyncHandler(async (req, res) => {
  const replies = await communityCommentService.getReplies(req.params.commentId);
  return sendResponse(res, {
    success: true,
    message: "Replies fetched successfully",
    data: { replies }
  });
});

module.exports = {
  createCommentController,
  editCommentController,
  deleteCommentController,
  getCommentsController,
  getRepliesController
};