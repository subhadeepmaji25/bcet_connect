// backend/src/modules/feed/controllers/feedBookmark.controller.js
const feedBookmarkService = require("../services/feedBookmark.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const toggleBookmarkController = asyncHandler(async (req, res) => {
  const result = await feedBookmarkService.toggleBookmark(req.user.id, req.params.postId);
  logger.info("Feed bookmark toggled", { module: "Feed", userId: req.user.id, postId: req.params.postId });
  return sendResponse(res, result);
});

const getMyBookmarksController = asyncHandler(async (req, res) => {
  const result = await feedBookmarkService.getMyBookmarks(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Bookmarks fetched successfully",
    data: { posts: result.posts },
    meta: { nextCursor: result.nextCursor }
  });
});

module.exports = { toggleBookmarkController, getMyBookmarksController };