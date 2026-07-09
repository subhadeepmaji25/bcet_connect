// backend/src/modules/feed/services/feedBookmark.service.js
const FeedPost = require("../models/FeedPost");
const FeedBookmark = require("../models/FeedBookmark");
const ApiError = require("../../../shared/errors/ApiError");
const { canViewPost, filterVisiblePosts } = require("./feedAccess.service");
const { POST_STATUS, PAGINATION, MODERATION_STATUS } = require("../constants/feed.constants");

const ACTIVE_VISIBLE_FILTER = {
  status: POST_STATUS.ACTIVE,
  $or: [
    { moderationStatus: MODERATION_STATUS.APPROVED },
    { moderationStatus: { $exists: false } }
  ]
};

const toggleBookmark = async (userId, postId) => {
  const post = await FeedPost.findOne({ _id: postId, ...ACTIVE_VISIBLE_FILTER });
  if (!post) throw ApiError.notFound("Post not found");
  if (!(await canViewPost(userId, post))) throw ApiError.notFound("Post not found");

  const existing = await FeedBookmark.findOne({ userId, postId });
  if (existing) {
    await FeedBookmark.deleteOne({ _id: existing._id });
    return { success: true, message: "Bookmark removed", data: { bookmarked: false } };
  }

  await FeedBookmark.create({ userId, postId });
  return { success: true, message: "Post bookmarked", data: { bookmarked: true } };
};

// Cursor on FeedBookmark's OWN _id — "when I saved it" is the sort key
// here, not "when it was originally posted".
const getMyBookmarks = async (userId, { cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = { userId };
  if (cursor) filter._id = { $lt: cursor };

  const bookmarks = await FeedBookmark.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate({
      path: "postId",
      match: ACTIVE_VISIBLE_FILTER,
      populate: { path: "authorId", select: "username role" }
    })
    .lean();

  // A bookmarked post deleted since saving populates as null — drop it
  // rather than showing a gap in the saved list.
  const populatedPosts = bookmarks.filter((b) => b.postId).map((b) => ({ ...b.postId, bookmarkedAt: b.createdAt }));
  const posts = await filterVisiblePosts(userId, populatedPosts);

  const nextCursor = bookmarks.length === pageSize ? bookmarks[bookmarks.length - 1]._id : null;
  return { posts, nextCursor };
};

const isBookmarked = async (userId, postId) => {
  const existing = await FeedBookmark.findOne({ userId, postId }).select("_id").lean();
  return Boolean(existing);
};

module.exports = { toggleBookmark, getMyBookmarks, isBookmarked };
