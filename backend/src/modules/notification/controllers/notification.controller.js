// backend/src/modules/notification/controllers/notification.controller.js
const notificationService = require("../services/notification.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

// FIXED — pehle sendResponse(res, 200, "msg", result) call ho raha tha, jabki shared
// sendResponse helper object-shape expect karta hai: sendResponse(res, {success, message, data}).
// Isse notification APIs ka response frontend ko wrong/undefined shape me ja raha tha.
const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, category, status } = req.query;
  const { items, pagination } = await notificationService.getNotifications(req.user.id, { page, limit, category, status });
  logger.info(`Notifications listed for user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "Notifications fetched successfully",
    data: { items },
    meta: { pagination }
  });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const { count } = await notificationService.getUnreadCount(req.user.id);
  return sendResponse(res, {
    success: true,
    message: "Unread count fetched successfully",
    data: { count }
  });
});

const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await notificationService.getNotificationById(req.user.id, req.params.id);
  return sendResponse(res, {
    success: true,
    message: "Notification fetched successfully",
    data: { notification }
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user.id, req.params.id);
  logger.info(`Notification ${req.params.id} marked as read by user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "Notification marked as read",
    data: { notification }
  });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  const { modifiedCount } = await notificationService.markAllAsRead(req.user.id);
  logger.info(`All notifications marked as read for user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "All notifications marked as read",
    data: { modifiedCount }
  });
});

const archiveNotification = asyncHandler(async (req, res) => {
  const notification = await notificationService.archiveNotification(req.user.id, req.params.id);
  logger.info(`Notification ${req.params.id} archived by user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "Notification archived",
    data: { notification }
  });
});

const archiveAllNotifications = asyncHandler(async (req, res) => {
  const { modifiedCount } = await notificationService.archiveAllNotifications(req.user.id);
  logger.info(`All notifications archived for user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "All notifications archived",
    data: { modifiedCount }
  });
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { deleted } = await notificationService.deleteNotification(req.user.id, req.params.id);
  logger.info(`Notification ${req.params.id} deleted by user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "Notification deleted",
    data: { deleted }
  });
});

const deleteAllNotifications = asyncHandler(async (req, res) => {
  const { deletedCount } = await notificationService.deleteAllNotifications(req.user.id);
  logger.info(`All notifications deleted for user ${req.user.id}`);
  return sendResponse(res, {
    success: true,
    message: "All notifications deleted",
    data: { deletedCount }
  });
});

module.exports = {
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