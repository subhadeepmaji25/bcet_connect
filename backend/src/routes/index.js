// backend/src/routes/index.js

const express = require("express");

const { app: appConfig } = require("../../config");

// ─────────────────────────────────────────
// Module Routes
// ─────────────────────────────────────────
const healthRoutes = require("../modules/health/route");
const authRoutes = require("../modules/auth/routes/auth.routes");
const userRoutes = require("../modules/users/routes/user.routes");
const searchRoutes = require("../modules/search/routes/search.routes");
const jobRoutes = require("../modules/jobs/routes/job.routes");
const recommendationRoutes = require("../modules/recommendation/routes/recommendation.routes");
const mentorshipRoutes = require("../modules/mentorship/routes/mentorship.routes");
const connectionRoutes = require("../modules/connections/routes/connection.routes");
const communicationRoutes = require("../modules/communication/routes/communication.routes");
// Notification platform layer — mounted after business domains since
// it's a cross-cutting concern consumed by every other module, not a
// business domain itself.
const notificationRoutes = require("../modules/notification/routes/notification.routes");
// Communities — mounted after Notification as it's the most-dependent
// module (relies on Users, Communication, Notification, Search all
// already being registered/available).
const communityRoutes = require("../modules/communities/routes/community.routes");
// Feed — mounted after Communities. Reads from Connections (candidate
// authors) and emits into Notification (mention/comment/like events),
// so both must already be registered above it.
const feedRoutes = require("../modules/feed/routes/feed.routes");
// Events — mounted after Feed. Reads from Communities (organizer
// permission check for community-scoped events) and emits into
// Notification (approve/reject/cancel/registration events); independent
// of Feed/Search for Phase 1, but registered after both to keep the
// "most-dependent module mounts last" ordering consistent.
const eventRoutes = require("../modules/events/routes/event.routes");
// NEW: Learning — mounted LAST. Depends on Users (Profile.department/
// semester/section/isCR for visibility + upload-role resolution),
// Notification (notify() calls from resource/engagement/discussion
// services), and Jobs (LearningPath.careerTrack reuses Job.JOB_CATEGORIES) —
// all three must already be registered/available above it, same
// "most-dependent module mounts last" ordering Events already follows.
const learningRoutes = require("../modules/learning/routes/learning.routes");
// Admin — mounted LAST of all, after Learning. It is the platform control
// layer that orchestrates every module above it (Users, Jobs, Events,
// Learning, Mentorship) through their existing service functions, so all
// of them must already be registered/available before this. Admin owns
// no business data of its own — same "most-dependent module mounts last"
// ordering Learning already follows, taken to its logical conclusion.
const adminRoutes = require("../modules/admin/routes/admin.routes");

// ─────────────────────────────────────────
// Register All API Routes
// ─────────────────────────────────────────
const registerRoutes = (app) => {
  const apiRouter = express.Router();

  // Health Check
  apiRouter.use("/health", healthRoutes);

  // Authentication
  apiRouter.use("/auth", authRoutes);

  // Users
  apiRouter.use("/users", userRoutes);

  // Search
  apiRouter.use("/search", searchRoutes);

  // Jobs
  apiRouter.use("/jobs", jobRoutes);

  // Recommendation
  apiRouter.use("/recommendation", recommendationRoutes);

  // Mentorship
  apiRouter.use("/mentorship", mentorshipRoutes);

  // Connections (Networking)
  apiRouter.use("/connections", connectionRoutes);

  // Communication (Conversations + Messages)
  apiRouter.use("/communication", communicationRoutes);

  // Notifications (Platform layer — consumed by all business modules)
  apiRouter.use("/notifications", notificationRoutes);

  // Communities (Feed + Chat hybrid — reuses Communication + Notification)
  apiRouter.use("/communities", communityRoutes);

  // Feed (global feed — reuses Connections + Notification)
  apiRouter.use("/feed", feedRoutes);

  // Events (career activities: hackathons, workshops, drives, meetups —
  // reuses Communities for organizer permission + Notification for
  // approve/reject/cancel/registration events)
  apiRouter.use("/events", eventRoutes);

  // Learning (Academic Resources + Career Learning Paths + Progress +
  // Subject Discussion + Analytics — reuses Users/Profile for
  // department/semester/section/isCR, Notification for resource/rating/
  // comment events, and Jobs for careerTrack enum reuse)
  apiRouter.use("/learning", learningRoutes);

  // Admin (Platform Control Layer — orchestrates Users/Jobs/Events/
  // Learning/Mentorship via their existing services; owns no business
  // data directly. Mounted last since it depends on every module above.)
  apiRouter.use("/admin", adminRoutes);

  // Mount API
  app.use(
    `${appConfig.api.prefix}/${appConfig.api.version}`,
    apiRouter
  );
};

module.exports = registerRoutes;