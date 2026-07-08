// backend/src/modules/notification/listeners/notification.listener.js
const logger = require("../../../shared/logger/logger");
const notificationService = require("../services/notification.service");
const {
  EVENT_METADATA,
  NOTIFICATION_EVENT_VALUES
} = require("../constants/notification.constants");

const interpolate = (template, data = {}) =>
  template.replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(data, key) ? String(data[key]) : match
  );

const notify = async (event, { userId, data, meta } = {}) => {
  try {
    if (!userId) {
      logger.warn(`[notification.listener] notify() called without userId for event "${event}"`);
      return null;
    }

    if (!NOTIFICATION_EVENT_VALUES.includes(event)) {
      logger.warn(`[notification.listener] Unknown notification event: "${event}"`);
      return null;
    }

    const metadata = EVENT_METADATA[event];
    if (!metadata) {
      logger.warn(`[notification.listener] No EVENT_METADATA registered for "${event}"`);
      return null;
    }

    const title = interpolate(metadata.titleTemplate, data);
    const body = interpolate(metadata.bodyTemplate, data);

    const notification = await notificationService.createNotification({
      userId,
      event,
      category: metadata.category,
      type: metadata.type,
      priority: metadata.priority,
      actionType: metadata.actionType,
      title,
      body,
      meta: meta || {}
    });

    logger.info(`[notification.listener] Notification created: ${event} → user ${userId}`);
    return notification;
  } catch (err) {
    logger.error(`[notification.listener] Failed to create notification for "${event}": ${err.message}`);
    return null;
  }
};

module.exports = { notify };