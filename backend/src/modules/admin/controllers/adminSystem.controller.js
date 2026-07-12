// backend/src/modules/admin/controllers/adminSystem.controller.js
//
// NOTE: Only broadcast is implemented in this phase. "Feature Flags" from
// the original architecture doc has NO backing model/config anywhere in
// the codebase today (confirmed — grepped the whole project) — building
// it now would mean inventing a whole new subsystem (a FeatureFlag model,
// a flags cache, a way for other modules to read it) that no other module
// currently depends on. Adding a stub here would be dishonest scaffolding.
// This is flagged as a distinct future phase, not silently skipped.

const adminBroadcastService = require("../services/adminBroadcast.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const broadcastController = asyncHandler(async (req, res) => {
  const result = await adminBroadcastService.broadcastAnnouncement(req.user.id, req.body);
  logger.info("Broadcast sent", {
    module: "Admin",
    adminId: req.user.id,
    audience: req.body.audience || "all",
    recipientCount: result.data.recipientCount
  });
  return sendResponse(res, result);
});

module.exports = {
  broadcastController
};