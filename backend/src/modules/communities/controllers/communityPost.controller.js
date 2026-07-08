// backend/src/modules/communities/controllers/communityPost.controller.js
const communityPostService = require("../services/communityPost.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createPostController = asyncHandler(async (req, res) => {
  const result = await communityPostService.createPost(req.user.id, req.params.communityId, req.body);
  logger.info("Community post created", { module: "Communities", userId: req.user.id, communityId: req.params.communityId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const editPostController = asyncHandler(async (req, res) => {
  const result = await communityPostService.editPost(req.user.id, req.params.postId, req.body);
  logger.info("Community post edited", { module: "Communities", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const deletePostController = asyncHandler(async (req, res) => {
  const result = await communityPostService.deletePost(req.user.id, req.params.postId);
  logger.info("Community post deleted", { module: "Communities", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const pinPostController = asyncHandler(async (req, res) => {
  const { pinned } = req.body;
  const result = await communityPostService.pinPost(req.user.id, req.params.postId, pinned);
  logger.info("Community post pin toggled", { module: "Communities", userId: req.user.id, postId: req.params.postId, pinned });
  return sendResponse(res, result);
});

const likePostController = asyncHandler(async (req, res) => {
  const result = await communityPostService.likePost(req.user.id, req.params.postId);
  return sendResponse(res, result);
});

// Guest-friendly: public community feeds are viewable without login,
// same optional-auth pattern as mentor public profile.
const getFeedController = asyncHandler(async (req, res) => {
  const viewerId = req.user?.id || null;
  const result = await communityPostService.getFeed(req.params.communityId, viewerId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Feed fetched successfully",
    data: { pinnedPosts: result.pinnedPosts, posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

const getPostByIdController = asyncHandler(async (req, res) => {
  const viewerId = req.user?.id || null;
  const post = await communityPostService.getPostById(req.params.postId, viewerId);
  return sendResponse(res, {
    success: true,
    message: "Post fetched successfully",
    data: { post }
  });
});

module.exports = {
  createPostController,
  editPostController,
  deletePostController,
  pinPostController,
  likePostController,
  getFeedController,
  getPostByIdController
};