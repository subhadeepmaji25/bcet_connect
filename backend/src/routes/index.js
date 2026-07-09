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
// NEW: Feed — mounted last. Reads from Connections (candidate authors)
// and emits into Notification (mention/comment/like events), so both
// must already be registered above it.
const feedRoutes = require("../modules/feed/routes/feed.routes");

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

  // Mount API
  app.use(
    `${appConfig.api.prefix}/${appConfig.api.version}`,
    apiRouter
  );
};

module.exports = registerRoutes;