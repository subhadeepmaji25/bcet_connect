// backend/src/core/scheduleMentorSessionCron.js
//
// Same fire-safe pattern as scheduleJobExpiryCron in bootstrap.js — runs
// once immediately at boot (so a server restart doesn't leave sessions
// stuck at "scheduled" for up to a minute), then every minute after
// that. A failed tick logs and moves on; it never crashes the process.
//
// Runs every minute (not hourly like the job-expiry cron) because
// sessions are minute-granular — a 30-minute session needs its "live"
// and "ended" transitions to land within a minute of the real time,
// not within an hour.

const cron = require("node-cron");
const logger = require("../shared/logger/logger");
const { markSessionsLive, autoCompleteSessions } = require("../modules/mentorship/services/mentorSession.service");

const scheduleMentorSessionCron = () => {
  const runTick = async () => {
    try {
      const liveCount = await markSessionsLive();
      const completedCount = await autoCompleteSessions();

      if (liveCount || completedCount) {
        logger.info("Mentor session cron ran", {
          module: "Mentorship",
          liveCount,
          completedCount
        });
      }
    } catch (error) {
      logger.error("Mentor session cron failed", { module: "Mentorship", error: error.message });
    }
  };

  cron.schedule("* * * * *", runTick); // every minute
  runTick(); // catch up on anything missed since last restart
  logger.success("Mentor Session Cron Scheduled");
};

module.exports = { scheduleMentorSessionCron };