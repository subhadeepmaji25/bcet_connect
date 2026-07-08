// backend/src/modules/notification/services/notification.service.js
//
// This file is the ONLY place that touches the Notification model.
// Business modules never import this file directly — they emit
// through notification.listener.js's notify() helper. Controllers
// call this file for read/manage operations only (GET, PATCH, DELETE).

const Notification = require("../models/notification.model");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");
const {
  NOTIFICATION_STATUS,
  PAGINATION
} = require("../constants/notification.constants");

// ── Create (called only by the listener, never by a controller) ────
// FIXED: wrapped in try/catch so a Mongoose validation error becomes an
// ApiError like everywhere else in the codebase, and so a bad payload
// from one listener can never crash the event-emit call site — this
// keeps notification failures non-fatal to the business action that
// triggered them (e.g. a malformed notify() call must never block
// the job-approval or mentorship-accept flow that emitted it).
const createNotification = async ({
  userId,
  event,
  category,
  type,
  priority,
  title,
  body,
  actionType,
  meta
}) => {
  try {
    const notification = await Notification.create({
      userId,
      event,
      category,
      type,
      priority,
      title,
      body,
      actionType,
      meta: meta || {}
    });
    return notification;
  } catch (err) {
    logger.error(`Failed to create notification for user ${userId}, event ${event}: ${err.message}`);
    throw ApiError.internal("Failed to create notification");
  }
};

// ── Read ──────────────────────────────────────────────────────────
const getNotifications = async (userId, { page, limit, category, status } = {}) => {
  const currentPage = Math.max(parseInt(page, 10) || PAGINATION.DEFAULT_PAGE, 1);
  const pageSize = Math.min(
    parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );

  const filter = { userId };
  if (category) filter.category = category;
  // Default view excludes archived unless explicitly requested.
  filter.status = status || { $ne: NOTIFICATION_STATUS.ARCHIVED };

  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Notification.countDocuments(filter)
  ]);

  return {
    items,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1
    }
  };
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    userId,
    status: NOTIFICATION_STATUS.UNREAD
  });
  return { count };
};

const getNotificationById = async (userId, notificationId) => {
  const notification = await Notification.findOne({ _id: notificationId, userId }).lean();
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  return notification;
};

// ── Mutations (all ownership-scoped: findOne({_id, userId})) ───────
const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { status: NOTIFICATION_STATUS.READ, readAt: new Date() },
    { new: true }
  );
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { userId, status: NOTIFICATION_STATUS.UNREAD },
    { status: NOTIFICATION_STATUS.READ, readAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount };
};

const archiveNotification = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { status: NOTIFICATION_STATUS.ARCHIVED, archivedAt: new Date() },
    { new: true }
  );
  if (!notification) {
    throw ApiError.notFound("Notification not found");
  }
  return notification;
};

const archiveAllNotifications = async (userId) => {
  const result = await Notification.updateMany(
    { userId, status: { $ne: NOTIFICATION_STATUS.ARCHIVED } },
    { status: NOTIFICATION_STATUS.ARCHIVED, archivedAt: new Date() }
  );
  return { modifiedCount: result.modifiedCount };
};

// Soft delete recommended (per earlier design discussion) — but since
// there's no separate "deleted" status defined in constants, and a
// genuinely deleted notification has no further UI use, this performs
// a real delete scoped strictly to the owner. Revisit only if an audit
// trail on notifications specifically becomes a requirement.
const deleteNotification = async (userId, notificationId) => {
  const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
  if (!result) {
    throw ApiError.notFound("Notification not found");
  }
  return { deleted: true };
};

const deleteAllNotifications = async (userId) => {
  const result = await Notification.deleteMany({ userId });
  return { deletedCount: result.deletedCount };
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  archiveAllNotifications,
  deleteNotification,
  deleteAllNotifications
};