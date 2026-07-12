// backend/src/modules/events/controllers/eventBookmark.controller.js
const bookmarkService = require("../services/eventBookmark.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const toggleBookmarkController = asyncHandler(async (req, res) => {
  const result = await bookmarkService.toggleBookmark(req.user.id, req.params.eventId);
  logger.info("Event bookmark toggled", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const getMyBookmarksController = asyncHandler(async (req, res) => {
  const result = await bookmarkService.getMyBookmarks(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your bookmarks fetched",
    data: { bookmarks: result.bookmarks },
    meta: { pagination: result.pagination }
  });
});

module.exports = {
  toggleBookmarkController,
  getMyBookmarksController
};