// backend/src/modules/admin/constants/admin.constants.js
//
// Admin module ke saare enums ek jagah — koi bhi admin service/controller
// yahan se import karega, kahin bhi hardcoded string nahi likhega.
//
// FIX: this file was out of sync with adminApproval.service.js and
// adminModeration.service.js — REPORT was missing from
// APPROVAL_QUEUE_TYPES, and MODERATION_ACTIONS didn't exist at all,
// despite adminModeration.service.js importing and using it on every
// single function (resolveReport, deletePost, hidePost,
// suspendCommunity, disbandCommunity). That caused a guaranteed
// TypeError the first time any moderation action was ever called.

// ── User account actions (adminUser.service.js) ────────────────────
const ADMIN_ACTIONS = Object.freeze({
  APPROVE: "approve",
  REJECT: "reject",
  SUSPEND: "suspend",
  BAN: "ban",
  ACTIVATE: "activate"
});
const ADMIN_ACTION_VALUES = Object.freeze(Object.values(ADMIN_ACTIONS));

// ── Unified Approval Queue types (adminApproval.service.js) ────────
// FIX: added REPORT — adminApproval.service.js's getUnifiedPendingQueue(),
// getPendingByType(), and decideApproval() all already handle
// APPROVAL_QUEUE_TYPES.REPORT; without this entry it silently
// evaluated to undefined and the "report" queue type could never match.
const APPROVAL_QUEUE_TYPES = Object.freeze({
  JOB: "job",
  EVENT: "event",
  RESOURCE: "resource",
  MENTOR: "mentor",
  REPORT: "report"
  // NOTE: "community" is intentionally NOT included — Community module
  // has no PENDING state in COMMUNITY_STATUS today, so it can't go
  // through an approve/reject queue. Community moderation (suspend/
  // disband) is handled separately via adminModeration.service.js.
});
const APPROVAL_QUEUE_TYPE_VALUES = Object.freeze(Object.values(APPROVAL_QUEUE_TYPES));

// ── Moderation actions (adminModeration.service.js) ─────────────────
// FIX: this entire object was missing. adminModeration.service.js
// references MODERATION_ACTIONS.RESOLVE_REPORT, .DISMISS_REPORT,
// .DELETE_POST, .HIDE_POST, .SUSPEND_COMMUNITY, .DISBAND_COMMUNITY —
// every one of those would have thrown "Cannot read properties of
// undefined" the moment an admin used any moderation route.
const MODERATION_ACTIONS = Object.freeze({
  DELETE_POST: "delete_post",
  HIDE_POST: "hide_post",
  RESOLVE_REPORT: "resolve_report",
  DISMISS_REPORT: "dismiss_report",
  SUSPEND_COMMUNITY: "suspend_community",
  DISBAND_COMMUNITY: "disband_community"
});
const MODERATION_ACTION_VALUES = Object.freeze(Object.values(MODERATION_ACTIONS));

module.exports = {
  ADMIN_ACTIONS,
  ADMIN_ACTION_VALUES,
  APPROVAL_QUEUE_TYPES,
  APPROVAL_QUEUE_TYPE_VALUES,
  MODERATION_ACTIONS,
  MODERATION_ACTION_VALUES
};