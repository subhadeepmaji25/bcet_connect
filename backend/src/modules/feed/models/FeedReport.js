// backend/src/modules/feed/models/FeedReport.js
const mongoose = require("mongoose");
const {
  REPORT_TARGET_TYPE_VALUES,
  REPORT_REASON_VALUES,
  REPORT_STATUS,
  REPORT_STATUS_VALUES
} = require("../constants/feed.constants");

const feedReportSchema = new mongoose.Schema({
  targetType: { type: String, enum: REPORT_TARGET_TYPE_VALUES, required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedPost", default: null, index: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: "FeedComment", default: null, index: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  targetAuthorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  reason: { type: String, enum: REPORT_REASON_VALUES, required: true },
  note: { type: String, trim: true, maxlength: 500, default: "" },
  status: { type: String, enum: REPORT_STATUS_VALUES, default: REPORT_STATUS.PENDING, index: true },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  resolvedAt: { type: Date, default: null },
  resolutionNote: { type: String, trim: true, maxlength: 500, default: "" }
}, { timestamps: true, versionKey: false });

feedReportSchema.index(
  { targetType: 1, postId: 1, reporterId: 1 },
  { unique: true, partialFilterExpression: { postId: { $type: "objectId" } } }
);
feedReportSchema.index(
  { targetType: 1, commentId: 1, reporterId: 1 },
  { unique: true, partialFilterExpression: { commentId: { $type: "objectId" } } }
);
feedReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("FeedReport", feedReportSchema);
