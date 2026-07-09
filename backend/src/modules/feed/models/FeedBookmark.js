// backend/src/modules/feed/models/FeedBookmark.js
//
// Phase 3 - "save for later". Backed by controller/route wiring and
// kept as its own collection so "Saved Posts" can be cursor-paginated
// without bloating FeedPost or User documents.
//
// Deliberately its own tiny collection rather than an array field on
// User or FeedPost - a bookmark list needs its own cursor-paginated
// query ("show me my saved posts, newest first") which an embedded
// array on User can't do cleanly at scale, same reasoning already
// applied to keeping FeedReaction separate from FeedPost.

const mongoose = require("mongoose");

const feedBookmarkSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", required: true, index: true }
}, { timestamps: true, versionKey: false });

// A post can only be bookmarked once per user - re-tapping "Save"
// should be a delete (unbookmark), never a duplicate row.
feedBookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });
// "My saved posts" list, newest-saved first.
feedBookmarkSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("FeedBookmark", feedBookmarkSchema);
