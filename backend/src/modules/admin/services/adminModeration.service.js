// backend/src/modules/admin/services/adminModeration.service.js
//
// PURE ORCHESTRATOR — same rule as adminApproval.service.js. This file
// owns ZERO Mongoose models directly. Every action delegates to the
// existing Feed/Communities service functions.
//
// WHY THIS FILE EXISTS: adminDashboard.service.js already counts pending
// FeedReports for the dashboard widget, but until now there was no way
// for an admin to actually act on a report, delete/hide a post, or
// suspend/disband a community — despite this being an explicit project
// requirement (Case 8: "Admin kisi bhi post ko delete kar sakta hai, koi
// bhi community disband kar sakta hai").

const feedReportService = require("../../feed/services/feedReport.service");
const feedPostService = require("../../feed/services/feedPost.service");
const communityService = require("../../communities/services/community.service");

const ApiError = require("../../../shared/errors/ApiError");
const { MODERATION_ACTIONS } = require("../constants/admin.constants");
const { logAction } = require("./adminAuditLog.service");

// ── Feed Reports ──────────────────────────────────────────────────
// NOTE: exact function names below (getReports/resolveReport/moderatePost)
// are taken from feedReport.service.js as confirmed in earlier codebase
// analysis. If the real signatures differ, adjust the calls, not the
// architecture.
const getPendingReports = async ({ page = 1, limit = 20 } = {}) => {
  return feedReportService.getReports("admin", { status: "pending", page, limit });
};

const resolveReport = async (reportId, adminId, { action, reason = "" } = {}) => {
  if (!["resolve", "dismiss"].includes(action)) {
    throw ApiError.badRequest('action must be "resolve" or "dismiss"');
  }

  const result = await feedReportService.resolveReport(adminId, "admin", reportId, {
    status: action === "resolve" ? "resolved" : "dismissed",
    resolutionNote: reason
  });

  await logAction({
    adminId,
    action: action === "resolve" ? MODERATION_ACTIONS.RESOLVE_REPORT : MODERATION_ACTIONS.DISMISS_REPORT,
    targetType: "report",
    targetId: reportId,
    reason
  });

  return result;
};

// ── Feed Posts (direct moderation, independent of a report existing) ──
const deletePost = async (postId, adminId, reason = "") => {
  const result = await feedPostService.moderatePost(postId, adminId, "delete", reason);

  await logAction({
    adminId,
    action: MODERATION_ACTIONS.DELETE_POST,
    targetType: "post",
    targetId: postId,
    reason
  });

  return result;
};

const hidePost = async (postId, adminId, reason = "") => {
  const result = await feedPostService.moderatePost(postId, adminId, "hide", reason);

  await logAction({
    adminId,
    action: MODERATION_ACTIONS.HIDE_POST,
    targetType: "post",
    targetId: postId,
    reason
  });

  return result;
};

// ── Communities ───────────────────────────────────────────────────
// NOTE: community.service.js was confirmed (earlier analysis) to only
// have archiveCommunity() — no dedicated suspend/disband pair. Until
// that module adds them, both actions map to the closest existing verb
// (archiveCommunity), distinguished only in the audit log's `action`
// field, same non-rewriting-convention pattern used for ban/suspend on
// User. This is flagged here, not silently hidden.
const suspendCommunity = async (communityId, adminId, reason = "") => {
  const result = await communityService.archiveCommunity(communityId, adminId, reason);

  await logAction({
    adminId,
    action: MODERATION_ACTIONS.SUSPEND_COMMUNITY,
    targetType: "community",
    targetId: communityId,
    reason,
    metadata: { note: "archiveCommunity() reused — no dedicated suspend verb exists yet in community.service.js" }
  });

  return result;
};

const disbandCommunity = async (communityId, adminId, reason = "") => {
  const result = await communityService.archiveCommunity(communityId, adminId, reason);

  await logAction({
    adminId,
    action: MODERATION_ACTIONS.DISBAND_COMMUNITY,
    targetType: "community",
    targetId: communityId,
    reason,
    metadata: { note: "archiveCommunity() reused — no dedicated disband verb exists yet in community.service.js" }
  });

  return result;
};

module.exports = {
  getPendingReports,
  resolveReport,
  deletePost,
  hidePost,
  suspendCommunity,
  disbandCommunity
};