// backend/src/modules/feed/services/feedView.service.js
//
// Fire-and-forget impression tracking. Controller calls
// recordViewsAsync() WITHOUT awaiting it — a slow/failing view-write
// must never delay or break a feed read.

const FeedPost = require("../models/FeedPost");
const FeedView = require("../models/FeedView");
const logger = require("../../../shared/logger/logger");
const { VIEW_DEDUPE_WINDOW_HOURS } = require("../constants/feed.constants");

const DEDUPE_WINDOW_MS = VIEW_DEDUPE_WINDOW_HOURS * 60 * 60 * 1000;

const recordView = async (userId, postId) => {
  const existing = await FeedView.findOne({ postId, userId });
  const now = new Date();

  if (existing && now - existing.lastViewedAt < DEDUPE_WINDOW_MS) return; // within dedupe window

  if (existing) {
    existing.viewCount += 1;
    existing.lastViewedAt = now;
    await existing.save();
  } else {
    await FeedView.create({ postId, userId, lastViewedAt: now });
  }

  await FeedPost.updateOne({ _id: postId }, { $inc: { viewCount: 1 } });
};

// Batch entrypoint for getFeed() — takes the page's post ids, records
// all of them in the background. Controller does NOT await this.
const recordViewsAsync = (userId, postIds = []) => {
  Promise.all(postIds.map((postId) => recordView(userId, postId))).catch((err) => {
    logger.error(`[feedView.service] Failed to record views: ${err.message}`);
  });
};

const getViewCount = async (postId) => {
  const post = await FeedPost.findById(postId).select("viewCount").lean();
  return post?.viewCount || 0;
};

module.exports = { recordView, recordViewsAsync, getViewCount };