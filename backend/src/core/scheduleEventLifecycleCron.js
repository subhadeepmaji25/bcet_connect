// backend/src/core/scheduleEventLifecycleCron.js
//
// Same fire-safe pattern as scheduleMentorSessionCron.js — runs once
// immediately at boot (so a restart doesn't leave an event stuck at
// "approved" past its startTime for up to a minute), then every minute
// after that. A failed tick logs and moves on; it never crashes the
// process. Runs every minute (not hourly like the job-expiry cron)
// because startTime/endTime are minute-granular, same reasoning as
// mentor sessions.
//
// archiveOldEvents() only needs to run once a day (it's checking a
// 30-day-old cutoff, not a live transition), so it's gated behind a
// simple day-change check inside the same minute tick rather than a
// second cron.schedule() registration — one less moving part to wire
// into bootstrap.js.
//
// UPDATED (Phase 1 follow-up — Reminder cron): runTick() now also
// calls sendEventReminders() (24h-before / 2h-before), right after
// completeEvents() and before the once-a-day archive check. Reminders
// are per-event, per-window gated (Event.reminder24hSentAt /
// reminder2hSentAt), so — unlike archiveOldEvents() — they don't need
// their own day-change guard; sendEventReminders() itself is safe to
// call every single tick.

const cron = require("node-cron");
const logger = require("../shared/logger/logger");
const {
  markEventsLive,
  completeEvents,
  archiveOldEvents,
  sendEventReminders
} = require("../modules/events/services/event.service");

const scheduleEventLifecycleCron = () => {
  let lastArchiveRunDate = null;

  const runTick = async () => {
    try {
      const liveCount = await markEventsLive();
      const completedCount = await completeEvents();
      const remindersSentCount = await sendEventReminders();

      const today = new Date().toDateString();
      let archivedCount = 0;
      if (lastArchiveRunDate !== today) {
        archivedCount = await archiveOldEvents();
        lastArchiveRunDate = today;
      }

      if (liveCount || completedCount || remindersSentCount || archivedCount) {
        logger.info("Event lifecycle cron ran", {
          module: "Events",
          liveCount,
          completedCount,
          remindersSentCount,
          archivedCount
        });
      }
    } catch (error) {
      logger.error("Event lifecycle cron failed", { module: "Events", error: error.message });
    }
  };

  cron.schedule("* * * * *", runTick); // every minute
  runTick(); // catch up on anything missed since last restart
  logger.success("Event Lifecycle Cron Scheduled");
};

module.exports = { scheduleEventLifecycleCron };