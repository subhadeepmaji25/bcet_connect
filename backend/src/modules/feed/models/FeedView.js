// backend/src/modules/feed/models/FeedView.js
//
// One row per (user, post) — NOT one row per scroll. Upserted, so
// re-viewing within VIEW_DEDUPE_WINDOW_HOURS is a no-op write.
const mongoose = require("mongoose");

const feedViewSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  viewCount: { type: Number, default: 1 },
  lastViewedAt: { type: Date, default: Date.now }
}, { timestamps: true, versionKey: false });

feedViewSchema.index({ postId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("FeedView", feedViewSchema);