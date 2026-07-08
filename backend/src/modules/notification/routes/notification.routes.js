// backend/src/modules/notification/routes/notification.routes.js
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  archiveAllNotifications,
  deleteNotification,
  deleteAllNotifications
} = require("../controllers/notification.controller");

const authMiddleware = require("../../../shared/middlewares/auth.middleware");

// All notification routes are for the logged-in user's own inbox —
// no admin/role branching needed here (unlike Jobs/Mentorship), and no
// request-body validators needed since every route here is either a
// pure GET with query params or a param-only mutation (no body shape
// to validate — same reasoning as connection/mentorRequest's
// no-body-schema routes).
router.use(authMiddleware);

// Static routes before dynamic :id routes (existing project convention).
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/archive-all", archiveAllNotifications);
router.delete("/", deleteAllNotifications);

router.get("/", getNotifications);
router.get("/:id", getNotificationById);
router.patch("/:id/read", markAsRead);
router.patch("/:id/archive", archiveNotification);
router.delete("/:id", deleteNotification);

module.exports = router;