// backend/src/modules/feed/controllers/feedPost.controller.js
//
// PHASE 3 UPDATE: getFeedController now fires recordViewsAsync() after
// building the response — NOT awaited, so a slow/failing view-write can
// never delay or break a feed read (see feedView.service.js's own
// comment on this). Recommendation cards are filtered out first since
// their _id is synthetic ("rec_job_<jobId>"), not a real FeedPost
// ObjectId — passing one to FeedView/FeedPost would throw a cast error.
// Every other controller below: UNCHANGED.
const feedPostService = require("../services/feedPost.service");
const { recordViewsAsync } = require("../services/feedView.service"); // NEW
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createPostController = asyncHandler(async (req, res) => {
  const result = await feedPostService.createPost(req.user.id, req.user.role, req.body);
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

  // NEW — fire-and-forget impression tracking. Skip synthetic
  // recommendation cards (isRecommendation: true) since their _id
  // ("rec_job_<jobId>") isn't a real FeedPost ObjectId.
  recordViewsAsync(
    req.user.id,
    result.posts.filter((p) => !p.isRecommendation && !p.isCommunityPost).map((p) => p._id)
  );

  return sendResponse(res, {
    success: true,
    message: "Feed fetched successfully",
    data: { posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

const getPostByIdController = asyncHandler(async (req, res) => {
  const post = await feedPostService.getPostById(req.user.id, req.user.role, req.params.postId);
  return sendResponse(res, { success: true, message: "Post fetched successfully", data: { post } });
});

const getUserPostsController = asyncHandler(async (req, res) => {
  const result = await feedPostService.getUserPosts(req.user.id, req.user.role, req.params.userId, req.query);
  return sendResponse(res, {
    success: true,
    message: "User posts fetched successfully",
    data: { posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

const togglePinController = asyncHandler(async (req, res) => {
  const result = await feedPostService.togglePin(
    req.user.id,
    req.user.role,
    req.params.postId,
    req.body.pinned
  );
  return sendResponse(res, result);
});

const moderatePostController = asyncHandler(async (req, res) => {
  const result = await feedPostService.moderatePost(req.user.id, req.user.role, req.params.postId, req.body);
  return sendResponse(res, result);
});

module.exports = {
  createPostController, editPostController, deletePostController,
  toggleLikeController, getFeedController, getPostByIdController, getUserPostsController,
  togglePinController, moderatePostController
};
