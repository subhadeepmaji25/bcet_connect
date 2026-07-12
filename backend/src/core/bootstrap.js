// backend/src/core/bootstrap.js
//
// UPDATED (this pass): registers scheduleEventLifecycleCron() alongside
// scheduleJobExpiryCron() and scheduleMentorSessionCron() — same boot
// sequence position, same fire-and-forget-but-logged philosophy. Events
// won't auto-transition to live/completed/archived until the next
// restart or manual intervention if this fails to register, but it
// never crashes the server.
//
// (kept from earlier pass) registers scheduleMentorSessionCron()
// alongside the existing scheduleJobExpiryCron() — same reasoning.

const cron = require("node-cron");
const createApp = require("./app");
const { connectDB } = require("../../config/database");
const { env, app: appConfig } = require("../../config");
const logger = require("../shared/logger/logger");
const cloudinary = require("../shared/media/cloudinary.config");
const { expireOverdueJobs } = require("../modules/jobs/services/job.service");
const { scheduleMentorSessionCron } = require("./scheduleMentorSessionCron");
const { scheduleEventLifecycleCron } = require("./scheduleEventLifecycleCron"); // NEW

const validateStartup = () => {
  logger.success("Environment Loaded");
  logger.success("MongoDB Connected");
  logger.success("Express Ready");
  logger.success("Routes Registered");
  logger.success("Global Error Handler Registered");
};

// Runs once immediately at boot (so overdue jobs don't sit expired-but-
// marked-approved for up to an hour after a deploy/restart), then every
// hour on the hour after that.
const scheduleJobExpiryCron = () => {
  const runExpiry = async () => {
    try {
      const result = await expireOverdueJobs();
      logger.info("Job expiry cron ran", {
        module: "Jobs",
        modifiedCount: result?.data?.modifiedCount ?? 0
      });
    } catch (error) {
      // A failed cron tick should never crash the process — log and
      // let the next scheduled run try again.
      logger.error("Job expiry cron failed", { module: "Jobs", error: error.message });
    }
  };

  cron.schedule("0 * * * *", runExpiry); // every hour, on the hour
  runExpiry(); // also run once immediately at startup
  logger.success("Job Expiry Cron Scheduled");
};

// Fire-and-forget — a failed Cloudinary ping is a warning, not a
// startup blocker, since most routes don't depend on media upload.
const checkCloudinaryConnection = () => {
  cloudinary
    .verifyConnection()
    .then((result) => {
      if (result.connected) {
        logger.success("Cloudinary Connection Verified");
      } else {
        logger.warn("Cloudinary connection could not be verified at startup", {
          module: "Media",
          reason: result.reason
        });
      }
    })
    .catch(() => {
      // verifyConnection() already catches its own errors internally
      // and resolves with { connected: false }; this catch only guards
      // against something unexpected (e.g. the function itself missing).
      logger.warn("Cloudinary health check could not be run", { module: "Media" });
    });
};

const bootstrap = async () => {
  try {
    logger.info("Bootstrapping BCET Connect Backend...");

    if (!env.database.mongoUri) {
      throw new Error("MongoDB URI is missing");
    }

    await connectDB();
    const app = createApp();
    validateStartup();

    scheduleJobExpiryCron();
    scheduleMentorSessionCron();
    scheduleEventLifecycleCron(); // NEW
    checkCloudinaryConnection();

    logger.success(`${appConfig.name} Bootstrap Completed`);
    return app;
  } catch (error) {
    logger.error("Bootstrap Failed", error);
    throw error;
  }
};

module.exports = bootstrap;