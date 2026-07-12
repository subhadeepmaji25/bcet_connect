// backend/src/modules/admin/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");

// UPGRADE: dedicated admin limiters now used instead of reusing
// jobActionLimiter everywhere — jobActionLimiter kept only for the
// approvals/decide route where reuse still makes sense.
const {
  jobActionLimiter,
  adminUserActionLimiter,
  adminModerationActionLimiter,
  adminBroadcastLimiter
} = require("../../../shared/security/rateLimiters");

const {
  approveUserController, rejectUserController, suspendUserController,
  banUserController, activateUserController, getPendingUsersController,
  listUsersController, getUserByIdController
} = require("../controllers/adminUser.controller");

const { getUnifiedQueueController, getQueueByTypeController, decideApprovalController } = require("../controllers/adminApproval.controller");
const { getOverviewController, getUserStatsController, getPendingCountsController } = require("../controllers/adminDashboard.controller");
const { broadcastController } = require("../controllers/adminSystem.controller");
const { getAuditLogsController } = require("../controllers/adminAuditLog.controller");

const {
  getPendingReportsController, resolveReportController, deletePostController,
  hidePostController, suspendCommunityController, disbandCommunityController
} = require("../controllers/adminModeration.controller");

const {
  validateUserIdParam, validateReasonBody, validateRejectUserBody,
  validateListUsersQuery, validatePendingUsersQuery
} = require("../validators/adminUser.validator");

const { validateQueueTypeParam, validateDecideParams, validateDecideBody, validatePaginationQuery } = require("../validators/adminApproval.validator");
const { validateBroadcast } = require("../validators/adminSystem.validator");

const {
  validateReportIdParam, validatePostIdParam, validateCommunityIdParam,
  validateResolveReportBody, validateModerationReasonBody
} = require("../validators/adminModeration.validator");

router.use(authMiddleware, allowRoles("admin"));

// ─────────────────────────────────────────
// Dashboard Overview
// ─────────────────────────────────────────
router.get("/dashboard/overview", getOverviewController);
router.get("/dashboard/users", getUserStatsController);
router.get("/dashboard/pending-counts", getPendingCountsController);

// ─────────────────────────────────────────
// User Management
// UPGRADE: adminUserActionLimiter (40/hr, dedicated) replaces
// jobActionLimiter reuse — this is a security boundary route, not a
// generic-write route, so it needed its own tier.
// ─────────────────────────────────────────
router.get("/users", validateListUsersQuery, listUsersController);
router.get("/users/pending", validatePendingUsersQuery, getPendingUsersController);
router.get("/users/:userId", validateUserIdParam, getUserByIdController);

router.patch("/users/:userId/approve", validateUserIdParam, adminUserActionLimiter, approveUserController);
router.patch("/users/:userId/reject", validateUserIdParam, validateRejectUserBody, adminUserActionLimiter, rejectUserController);
router.patch("/users/:userId/suspend", validateUserIdParam, validateReasonBody, adminUserActionLimiter, suspendUserController);
router.patch("/users/:userId/ban", validateUserIdParam, validateReasonBody, adminUserActionLimiter, banUserController);
router.patch("/users/:userId/activate", validateUserIdParam, adminUserActionLimiter, activateUserController);

// ─────────────────────────────────────────
// Unified Approval Center
// jobActionLimiter kept here (approvals span job/event/resource/mentor/
// report — none of these carry the "compromised-admin-bans-everyone"
// risk profile that user-management or broadcast do).
// ─────────────────────────────────────────
router.get("/approvals", validatePaginationQuery, getUnifiedQueueController);
router.get("/approvals/:type", validateQueueTypeParam, validatePaginationQuery, getQueueByTypeController);
router.patch("/approvals/:type/:itemId/decide", validateDecideParams, validateDecideBody, jobActionLimiter, decideApprovalController);

// ─────────────────────────────────────────
// System (Broadcast)
// UPGRADE: adminBroadcastLimiter (5/hr) added — previously this route
// had NO rate limiter at all, despite a broadcast fanning out to every
// matching user platform-wide.
// ─────────────────────────────────────────
router.post("/broadcast", validateBroadcast, adminBroadcastLimiter, broadcastController);

// ─────────────────────────────────────────
// Audit Log (read-only)
// ─────────────────────────────────────────
router.get("/audit-logs", getAuditLogsController);

// ─────────────────────────────────────────
// Moderation Center (Feed + Communities)
// UPGRADE: adminModerationActionLimiter (60/hr, dedicated) replaces
// jobActionLimiter reuse.
// ─────────────────────────────────────────
router.get("/moderation/reports", validatePaginationQuery, getPendingReportsController);
router.patch("/moderation/reports/:reportId/resolve", validateReportIdParam, validateResolveReportBody, adminModerationActionLimiter, resolveReportController);
router.delete("/moderation/posts/:postId", validatePostIdParam, validateModerationReasonBody, adminModerationActionLimiter, deletePostController);
router.patch("/moderation/posts/:postId/hide", validatePostIdParam, validateModerationReasonBody, adminModerationActionLimiter, hidePostController);
router.patch("/moderation/communities/:communityId/suspend", validateCommunityIdParam, validateModerationReasonBody, adminModerationActionLimiter, suspendCommunityController);
router.delete("/moderation/communities/:communityId", validateCommunityIdParam, validateModerationReasonBody, adminModerationActionLimiter, disbandCommunityController);

module.exports = router;