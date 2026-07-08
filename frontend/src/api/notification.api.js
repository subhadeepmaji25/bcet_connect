// src/api/notification.api.js
import axiosClient from "./axiosClient";

// ── GET all notifications (excludes archived by default) ─────────────────────
// query: { page, limit, category, status }
// category enum: AUTH | PROFILE | JOB | APPLICATION | MENTORSHIP | CONNECTION | COMMUNICATION | SYSTEM
// status enum:   unread | read | archived  (omit = returns unread+read only)
export const getNotifications = (params) =>
  axiosClient.get("/notifications", { params });

// ── GET single notification ───────────────────────────────────────────────────
export const getNotificationById = (id) =>
  axiosClient.get(`/notifications/${id}`);

// ── GET unread count ──────────────────────────────────────────────────────────
export const getUnreadCount = () =>
  axiosClient.get("/notifications/unread-count");

// ── Mark one as read ──────────────────────────────────────────────────────────
export const markAsRead = (id) =>
  axiosClient.patch(`/notifications/${id}/read`);

// ── Archive one ───────────────────────────────────────────────────────────────
export const archiveNotification = (id) =>
  axiosClient.patch(`/notifications/${id}/archive`);

// ── Delete one ────────────────────────────────────────────────────────────────
export const deleteNotification = (id) =>
  axiosClient.delete(`/notifications/${id}`);

// ── Bulk actions ──────────────────────────────────────────────────────────────
export const markAllAsRead = () =>
  axiosClient.patch("/notifications/read-all");

export const archiveAllNotifications = () =>
  axiosClient.patch("/notifications/archive-all");

export const deleteAllNotifications = () =>
  axiosClient.delete("/notifications");
