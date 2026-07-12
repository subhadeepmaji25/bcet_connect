// backend/src/modules/admin/services/adminBroadcast.service.js
//
// UPGRADE: broadcastAnnouncement() now logs itself via adminAuditLog —
// no single targetId (a broadcast has no one target), full context goes
// into metadata instead.

const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { logAction } = require("./adminAuditLog.service");

const resolveAudienceUserIds = async (audience) => {
  const filter = { isDeleted: false, accountStatus: "active" };
  if (audience && audience !== "all") {
    if (!["student", "faculty", "alumni"].includes(audience)) {
      throw ApiError.badRequest('audience must be "all", "student", "faculty", or "alumni"');
    }
    filter.role = audience;
  }
  const users = await User.find(filter).select("_id").lean();
  return users.map((u) => u._id);
};

const broadcastAnnouncement = async (adminId, { title, body, audience = "all" } = {}) => {
  if (!title || !body) throw ApiError.badRequest("title and body are required for a broadcast");

  const userIds = await resolveAudienceUserIds(audience);

  if (userIds.length === 0) {
    await logAction({ adminId, action: "broadcast", targetType: "broadcast", metadata: { audience, recipientCount: 0, title } });
    return { success: true, message: "No active users matched the selected audience", data: { audience, recipientCount: 0 } };
  }

  const BATCH_SIZE = 200;
  let sent = 0;

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((userId) =>
        notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, { userId, data: { title, body }, meta: { adminId, broadcast: true, audience } })
      )
    );
    sent += batch.length;
    logger.info(`[adminBroadcast] Sent ${sent}/${userIds.length} announcement notifications`);
  }

  await logAction({ adminId, action: "broadcast", targetType: "broadcast", metadata: { audience, recipientCount: sent, title } });

  return { success: true, message: `Announcement sent to ${sent} user(s)`, data: { audience, recipientCount: sent } };
};

module.exports = { broadcastAnnouncement };