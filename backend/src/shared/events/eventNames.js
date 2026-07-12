// backend/src/shared/events/eventNames.js
//
// Single canonical list of every platform event name in BCET Connect.
//
// IMPORTANT — this file is the source of truth over the small
// NOTIFICATION_EVENTS objects that already exist inside:
//   - modules/connections/constants/connection.constants.js
//   - modules/mentorship/constants/mentor.constants.js
//   - modules/communication/constants/communication.constants.js
//
// Those were reserved ahead of time with the right idea (dot-namespaced
// strings like "connection.request.accepted"), but having three separate
// copies of "the list of events" is exactly the kind of drift that breaks
// a project later — if one copy gets updated and the other two don't, a
// listener silently stops matching. This file keeps their EXACT string
// values (so nothing that already reads them breaks) but is now the one
// place new event names get added going forward.
//
// Recommended follow-up (not urgent, do it whenever convenient): change
// those three constants files to `NOTIFICATION_EVENTS: require("../../../shared/events/eventNames")`
// style re-exports instead of hardcoding their own copies. Not required
// for Part 1 to work — just removes the duplication for good.
//
// Naming convention (keep this consistent for every future addition):
//   "<domain>.<entity>.<action>"   e.g. "job.application.received"
//
// This file has ZERO logic — just strings — same discipline as every
// other *.constants.js file already in this codebase.

const EVENTS = {
  // ---- Identity / Auth ----
  USER_REGISTERED: "user.registered",
  ACCOUNT_APPROVED: "user.account.approved",
  ACCOUNT_REJECTED: "user.account.rejected",
  PASSWORD_CHANGED: "user.password.changed",

  // ---- Profile / Users domain ----
  PROFILE_COMPLETED: "profile.completed",                  // fires once, first time completion crosses 100%
  PROFILE_COMPLETION_CHANGED: "profile.completion.changed", // fires every time % changes
  RESUME_UPLOADED: "resume.uploaded",
  RESUME_PARSED: "resume.parsed",

  // ---- Search / Recommendation ----
  SEARCH_PROFILE_UPDATED: "search.profile.updated",
  RECOMMENDATION_NEW_JOB_MATCH: "recommendation.job.match",

  // ---- Jobs ----
  JOB_APPROVED: "job.approved",
  JOB_REJECTED: "job.rejected",
  JOB_CLOSED: "job.closed",
  JOB_APPLICATION_RECEIVED: "job.application.received",
  JOB_APPLICATION_REVIEWED: "job.application.reviewed",

  // ---- Connections ---- (values identical to connection.constants.js — do not change)
  CONNECTION_REQUEST_CREATED: "connection.request.created",
  CONNECTION_REQUEST_ACCEPTED: "connection.request.accepted",
  CONNECTION_REQUEST_REJECTED: "connection.request.rejected",
  CONNECTION_REMOVED: "connection.removed",

  // ---- Mentorship ---- (values identical to mentor.constants.js — do not change)
  MENTORSHIP_REQUEST_CREATED: "mentorship.request.created",
  MENTORSHIP_REQUEST_ACCEPTED: "mentorship.request.accepted",
  MENTORSHIP_REQUEST_REJECTED: "mentorship.request.rejected",
  MENTORSHIP_SESSION_REMINDER: "mentorship.session.reminder",     // reserved — Sessions not built yet
  MENTORSHIP_SESSION_COMPLETED: "mentorship.session.completed",   // reserved — Sessions not built yet

  // ---- Communication ---- (values identical to communication.constants.js — do not change)
  MESSAGE_SENT: "communication.message.sent",
  CONVERSATION_ARCHIVED: "communication.conversation.archived",

  // ---- Reserved for modules that don't exist yet (Communities / Events) ----
  // Kept here, unused, on purpose — same "reserve the name early" pattern
  // this codebase already used for mentorship sessions. The day those
  // modules are built, the future Notification listener has a stable
  // name to attach to without anything needing to be renamed.
  COMMUNITY_INVITE_RECEIVED: "community.invite.received",
  EVENT_APPROVED: "event.approved",

  // ---- Learning (module not built yet — reserved ahead of time, same
  // pattern as MENTORSHIP_SESSION_* and COMMUNITY_INVITE_RECEIVED above.
  // Naming mirrors JOB_APPROVED / JOB_REJECTED's pending→approved shape
  // since Academic Learning's CR-upload approval flow is the same
  // pending → verified/rejected lifecycle as Jobs.) ----
  RESOURCE_PUBLISHED: "learning.resource.published",             // Faculty upload — auto-published
  RESOURCE_PENDING_VERIFICATION: "learning.resource.pending",    // CR upload — awaiting Faculty verification
  RESOURCE_VERIFIED: "learning.resource.verified",               // Faculty approved a CR's pending upload
  RESOURCE_REJECTED: "learning.resource.rejected"                // Faculty rejected a CR's pending upload
};

module.exports = EVENTS;