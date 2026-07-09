// backend/src/modules/feed/controllers/feedPost.controller.js
const feedPostService = require("../services/feedPost.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createPostController = asyncHandler(async (req, res) => {
  const result = await feedPostService.createPost(req.user.id, req.body);
  logger.info("Feed post created", { module: "Feed", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const editPostController = asyncHandler(async (req, res) => {
  const result = await feedPostService.editPost(req.user.id, req.params.postId, req.body);
  logger.info("Feed post edited", { module: "Feed", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const deletePostController = asyncHandler(async (req, res) => {
  const result = await feedPostService.deletePost(req.user.id, req.params.postId);
  logger.info("Feed post deleted", { module: "Feed", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const toggleLikeController = asyncHandler(async (req, res) => {
  const result = await feedPostService.toggleLike(req.user.id, req.params.postId);
  return sendResponse(res, result);
});

const getFeedController = asyncHandler(async (req, res) => {
  const result = await feedPostService.getFeed(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Feed fetched successfully",
    data: { posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

const getPostByIdController = asyncHandler(async (req, res) => {
  const post = await feedPostService.getPostById(req.params.postId);
  return sendResponse(res, { success: true, message: "Post fetched successfully", data: { post } });
});

const getUserPostsController = asyncHandler(async (req, res) => {
  const result = await feedPostService.getUserPosts(req.params.userId, req.query);
  return sendResponse(res, {
    success: true,
    message: "User posts fetched successfully",
    data: { posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

module.exports = {
  createPostController, editPostController, deletePostController,
  toggleLikeController, getFeedController, getPostByIdController, getUserPostsController
};