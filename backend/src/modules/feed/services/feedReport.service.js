// backend/src/modules/feed/services/feedReport.service.js
const FeedPost = require("../models/FeedPost");
const FeedComment = require("../models/FeedComment");
const FeedReport = require("../models/FeedReport");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { canViewPost } = require("./feedAccess.service");
const { isFeedAdmin, moderatePost } = require("./feedPost.service");
const { moderateComment } = require("./feedComment.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const {
  POST_STATUS,
  COMMENT_STATUS,
  MODERATION_STATUS,
  REPORT_TARGET_TYPE,
  REPORT_STATUS,
  PAGINATION
} = require("../constants/feed.constants");

const activeModeratedFilter = {
  $or: [
    { moderationStatus: MODERATION_STATUS.APPROVED },
    { moderationStatus: { $exists: false } }
  ]
};

const loadReportTarget = async (userId, targetType, targetId) => {
  if (targetType === REPORT_TARGET_TYPE.POST) {
    const post = await FeedPost.findOne({ _id: targetId, status: POST_STATUS.ACTIVE, ...activeModeratedFilter });
    if (!post) throw ApiError.notFound("Post not found");
    if (!(await canViewPost(userId, post))) throw ApiError.notFound("Post not found");
    return { post, targetAuthorId: post.authorId };
  }

  const comment = await FeedComment.findOne({ _id: targetId, status: COMMENT_STATUS.ACTIVE, ...activeModeratedFilter });
  if (!comment) throw ApiError.notFound("Comment not found");
  const post = await FeedPost.findOne({ _id: comment.postId, status: POST_STATUS.ACTIVE, ...activeModeratedFilter });
  if (!post || !(await canViewPost(userId, post))) throw ApiError.notFound("Comment not found");
  return { comment, post, targetAuthorId: comment.authorId };
};

const notifyAdmins = async (report, reporterId) => {
  const [admins, reporter] = await Promise.all([
    User.find({ role: "admin", isDeleted: false }).select("_id").lean(),
    User.findById(reporterId).select("username").lean()
  ]);

  await Promise.all(admins.map((admin) =>
    notify(N_EVENTS.FEED_CONTENT_REPORTED, {
      userId: admin._id,
      data: {
        reporterName: reporter?.username || "Someone",
        targetType: report.targetType
      },
      meta: {
        reportId: report._id,
        postId: report.postId,
        commentId: report.commentId,
        targetType: report.targetType
      }
    })
  ));
};

const createReport = async (userId, { targetType, targetId, reason, note = "" }) => {
  const target = await loadReportTarget(userId, targetType, targetId);

  const payload = {
    targetType,
    reporterId: userId,
    targetAuthorId: target.targetAuthorId,
    reason,
    note
  };

  if (targetType === REPORT_TARGET_TYPE.POST) payload.postId = targetId;
  else payload.commentId = targetId;

  try {
    const report = await FeedReport.create(payload);
    if (targetType === REPORT_TARGET_TYPE.POST) {
      await FeedPost.updateOne({ _id: targetId }, { $inc: { reportCount: 1 } });
    } else {
      await FeedComment.updateOne({ _id: targetId }, { $inc: { reportCount: 1 } });
    }
    await notifyAdmins(report, userId);
    return { success: true, message: "Report submitted", data: { report } };
  } catch (err) {
    if (err.code === 11000) {
      throw ApiError.conflict("You have already reported this content");
    }
    throw err;
  }
};

const getReports = async (adminRole, { status = REPORT_STATUS.PENDING, cursor, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  if (!isFeedAdmin(adminRole)) throw ApiError.forbidden("Only admins can view feed reports");
  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const filter = {};
  if (status) filter.status = status;
  if (cursor) filter._id = { $lt: cursor };

  const reports = await FeedReport.find(filter)
    .sort({ _id: -1 })
    .limit(pageSize)
    .populate("reporterId", "username role")
    .populate("targetAuthorId", "username role")
    .populate("postId", "content type status visibility reportCount")
    .populate("commentId", "content status reportCount postId")
    .lean();

  const nextCursor = reports.length === pageSize ? reports[reports.length - 1]._id : null;
  return { reports, nextCursor };
};

const resolveReport = async (adminId, adminRole, reportId, { status, action = "none", resolutionNote = "" } = {}) => {
  if (!isFeedAdmin(adminRole)) throw ApiError.forbidden("Only admins can resolve feed reports");
  const report = await FeedReport.findOne({ _id: reportId });
  if (!report) throw ApiError.notFound("Report not found");

  if (action !== "none") {
    const moderationAction = action === "hide" ? "hide" : action === "restore" ? "restore" : null;
    if (!moderationAction) throw ApiError.badRequest("action must be 'none', 'hide', or 'restore'");
    if (report.targetType === REPORT_TARGET_TYPE.POST) {
      await moderatePost(adminId, adminRole, report.postId, { action: moderationAction, note: resolutionNote });
    } else {
      await moderateComment(adminId, adminRole, report.commentId, { action: moderationAction, note: resolutionNote });
    }
  }

  report.status = status;
  report.resolvedBy = adminId;
  report.resolvedAt = new Date();
  report.resolutionNote = resolutionNote;
  await report.save();

  await notify(N_EVENTS.FEED_REPORT_RESOLVED, {
    userId: report.reporterId,
    data: { status },
    meta: { reportId: report._id, targetType: report.targetType }
  });

  return { success: true, message: "Report resolved", data: { report } };
};

module.exports = {
  createReport,
  getReports,
  resolveReport
};
