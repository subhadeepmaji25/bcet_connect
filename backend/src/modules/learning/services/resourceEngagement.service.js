// backend/src/modules/learning/services/resourceEngagement.service.js
const mongoose = require("mongoose");
const LearningResource = require("../models/LearningResource");
const ResourceBookmark = require("../models/ResourceBookmark");
const ResourceRating = require("../models/ResourceRating");
const ResourceComment = require("../models/ResourceComment");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { RESOURCE_STATUS } = require("../constants/resource.constants");
const logger = require("../../../shared/logger/logger");
const { assertCanAccessResource } = require("./resource.service");

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const loadEngageableResource = async (resourceId, userId, userRole) => {
  const resource = await assertCanAccessResource(resourceId, userId, userRole, { includeUnpublishedForOwner: false });
  if (resource.status !== RESOURCE_STATUS.PUBLISHED) throw ApiError.notFound("Resource not found");
  return resource;
};

const toggleBookmark = async (userId, userRole, resourceId) => {
  await loadEngageableResource(resourceId, userId, userRole);
  const existing = await ResourceBookmark.findOne({ userId, resourceId });
  if (existing) {
    await ResourceBookmark.deleteOne({ _id: existing._id });
    await LearningResource.updateOne({ _id: resourceId }, { $inc: { bookmarkCount: -1 } });
    return { success: true, message: "Bookmark removed", data: { bookmarked: false } };
  }
  await ResourceBookmark.create({ userId, resourceId });
  await LearningResource.updateOne({ _id: resourceId }, { $inc: { bookmarkCount: 1 } });
  return { success: true, message: "Resource bookmarked", data: { bookmarked: true } };
};

const getMyBookmarks = async (userId, { cursor, limit = 20 } = {}) => {
  const pageSize = Math.min(Number(limit), 50);
  const filter = { userId };
  if (cursor) filter._id = { $lt: cursor };

  const bookmarks = await ResourceBookmark.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate({
      path: "resourceId",
      match: { status: RESOURCE_STATUS.PUBLISHED, isArchived: false },
      populate: { path: "uploaderId", select: "username role" }
    })
    .lean();

  const resources = bookmarks
    .filter((b) => b.resourceId)
    .map((b) => ({ ...b.resourceId, bookmarkedAt: b.createdAt }));

  const nextCursor = bookmarks.length === pageSize ? bookmarks[bookmarks.length - 1]._id : null;
  return { resources, nextCursor };
};

const isBookmarked = async (userId, resourceId) => {
  const existing = await ResourceBookmark.findOne({ userId, resourceId }).select("_id").lean();
  return Boolean(existing);
};

const recalculateResourceRating = async (resourceId) => {
  const stats = await ResourceRating.aggregate([
    { $match: { resourceId: new mongoose.Types.ObjectId(resourceId) } },
    { $group: { _id: "$resourceId", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  const { avgRating = 0, count = 0 } = stats[0] || {};
  await LearningResource.updateOne(
    { _id: resourceId },
    { $set: { ratingAverage: Math.round(avgRating * 10) / 10, ratingCount: count } }
  );
};

const rateResource = async (userId, userRole, resourceId, rating, review = "") => {
  const resource = await loadEngageableResource(resourceId, userId, userRole);
  if (resource.uploaderId.toString() === userId.toString()) {
    throw ApiError.forbidden("You cannot rate your own upload");
  }

  await ResourceRating.findOneAndUpdate(
    { userId, resourceId },
    { $set: { rating, review } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await recalculateResourceRating(resourceId);
  } catch (err) {
    logger.error("Failed to recalculate resource rating", {
      module: "Learning", resourceId, userId, error: err.message
    });
  }

  const raterName = await getUsernameSafe(userId);
  await notify(NOTIFICATION_EVENTS.RESOURCE_RATED, {
    userId: resource.uploaderId,
    data: { raterName, rating, resourceTitle: resource.title },
    meta: { resourceId }
  });

  return { success: true, message: "Rating submitted", data: { rating, review } };
};

const getMyRating = async (userId, resourceId) => {
  const existing = await ResourceRating.findOne({ userId, resourceId }).lean();
  return existing || null;
};

const getResourceRatings = async (resourceId, { page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [ratings, total] = await Promise.all([
    ResourceRating.find({ resourceId })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("userId", "username role")
      .lean(),
    ResourceRating.countDocuments({ resourceId })
  ]);
  return { ratings, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const createComment = async (userId, userRole, resourceId, { content, parentCommentId = null }) => {
  const resource = await loadEngageableResource(resourceId, userId, userRole);

  if (parentCommentId) {
    const parent = await ResourceComment.findOne({ _id: parentCommentId, status: "active" });
    if (!parent || parent.resourceId.toString() !== resourceId.toString()) {
      throw ApiError.badRequest("Invalid parent comment");
    }
  }

  const comment = await ResourceComment.create({
    resourceId,
    authorId: userId,
    content,
    parentCommentId
  });

  if (!parentCommentId && resource.uploaderId.toString() !== userId.toString()) {
    const commenterName = await getUsernameSafe(userId);
    await notify(NOTIFICATION_EVENTS.RESOURCE_COMMENT_RECEIVED, {
      userId: resource.uploaderId,
      data: { commenterName, resourceTitle: resource.title },
      meta: { resourceId, commentId: comment._id }
    });
  }

  return { success: true, message: "Comment added", data: { comment } };
};

const editComment = async (userId, commentId, content) => {
  const comment = await ResourceComment.findOne({ _id: commentId, authorId: userId, status: "active" });
  if (!comment) throw ApiError.notFound("Comment not found");

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  return { success: true, message: "Comment updated", data: { comment } };
};

const deleteComment = async (userId, userRole, commentId) => {
  const comment = await ResourceComment.findOne({ _id: commentId, status: "active" });
  if (!comment) throw ApiError.notFound("Comment not found");

  const isAuthor = comment.authorId.toString() === userId.toString();
  if (!isAuthor && userRole !== "admin" && userRole !== "faculty") {
    throw ApiError.forbidden("You can only delete your own comments");
  }

  comment.status = "removed";
  await comment.save();

  return { success: true, message: "Comment deleted", data: null };
};

const getComments = async (userId, userRole, resourceId, { cursor, limit = 20 } = {}) => {
  await loadEngageableResource(resourceId, userId, userRole);
  const pageSize = Math.min(Number(limit), 50);
  const filter = { resourceId, parentCommentId: null, status: "active" };
  if (cursor) filter._id = { $gt: cursor };

  const comments = await ResourceComment.find(filter)
    .sort({ _id: 1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = comments.length === pageSize ? comments[comments.length - 1]._id : null;
  return { comments, nextCursor };
};

const getReplies = async (parentCommentId) => {
  const parent = await ResourceComment.findOne({ _id: parentCommentId, status: "active" }).lean();
  if (!parent) throw ApiError.notFound("Comment not found");

  const replies = await ResourceComment.find({ parentCommentId, status: "active" })
    .sort({ createdAt: 1 })
    .populate("authorId", "username role")
    .lean();
  return replies;
};

const toggleCommentLike = async (userId, commentId) => {
  const comment = await ResourceComment.findOne({ _id: commentId, status: "active" });
  if (!comment) throw ApiError.notFound("Comment not found");

  const alreadyLiked = comment.likedBy.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    await ResourceComment.updateOne(
      { _id: commentId },
      { $pull: { likedBy: userId }, $inc: { likeCount: -1 } }
    );
    return { success: true, message: "Like removed", data: { liked: false } };
  }

  await ResourceComment.updateOne(
    { _id: commentId },
    { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } }
  );
  return { success: true, message: "Comment liked", data: { liked: true } };
};

const trackDownload = async (userId, userRole, resourceId) => {
  await loadEngageableResource(resourceId, userId, userRole);
  await LearningResource.updateOne({ _id: resourceId }, { $inc: { downloadCount: 1 } });
  return { success: true, message: "Download recorded", data: null };
};

module.exports = {
  toggleBookmark,
  getMyBookmarks,
  isBookmarked,
  rateResource,
  getMyRating,
  getResourceRatings,
  createComment,
  editComment,
  deleteComment,
  getComments,
  getReplies,
  toggleCommentLike,
  trackDownload
};
