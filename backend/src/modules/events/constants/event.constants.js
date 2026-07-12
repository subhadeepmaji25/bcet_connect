// backend/src/modules/events/constants/event.constants.js
//
// NEW MODULE — Events.
//
// Design decision (read this before touching the status enum):
// The original brainstorm docs proposed a 9-state lifecycle
// (Draft → Pending → Approved → Published → Registration Open →
// Registration Closed → Live → Completed → Archived). That's collapsed
// here to match how Jobs already models the exact same shape of problem:
// Job never has a separate "published" status distinct from "approved" —
// "approved" already means "publicly visible and actionable". Job also
// never has a literal "applications-open"/"applications-closed" status —
// that's a computed virtual (`isOpen`) driven by `deadline`, not a stored
// state. Events copies that exact approach:
//   - APPROVED already means published + registrable (no separate step)
//   - "is registration open" is a computed virtual on the model
//     (isRegistrationOpen), not a stored status
//   - LIVE / COMPLETED / ARCHIVED are the only additional states, and
//     they're cron-driven off startTime/endTime — same mechanism as
//     Job's expireOverdueJobs() cron, see core/scheduleEventLifecycleCron.js
// This keeps Events consistent with the one lifecycle pattern this
// codebase has already proven twice (Jobs, MentorRequest/MentorSession),
// instead of inventing a third, more complex one.

const EVENT_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",   // == published + registrable, same semantics as Job's "approved"
  REJECTED: "rejected",
  LIVE: "live",           // cron-set when now >= startTime
  COMPLETED: "completed", // cron-set when now >= endTime
  CANCELLED: "cancelled", // manual, organizer or admin, from approved/live
  ARCHIVED: "archived"    // cron-set N days after completion
});
const EVENT_STATUS_VALUES = Object.freeze(Object.values(EVENT_STATUS));

const EVENT_CATEGORIES = Object.freeze([
  "hackathon", "workshop", "seminar", "placement-drive", "coding-contest",
  "webinar", "community-meetup", "alumni-talk", "mentorship-session",
  "faculty-session", "sports", "cultural", "other"
]);

// Mirrors Jobs' POSTER_ROLES pattern (job.service.js) — who may create an
// event at all. "community-leader" is not a User.role value (it's a
// CommunityMember.role) so it is checked separately, see
// assertCanCreateForCommunity() in event.service.js.
const ORGANIZER_ROLES = Object.freeze(["faculty", "alumni", "admin"]);

// Days after `completed` that the lifecycle cron auto-archives an event.
// Kept as a named constant (not a magic number in the cron file) so it
// can be tuned later without hunting through cron logic.
const ARCHIVE_AFTER_DAYS = 30;

const REGISTRATION_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  WAITLISTED: "waitlisted",
  CANCELLED: "cancelled"
});
const REGISTRATION_STATUS_VALUES = Object.freeze(Object.values(REGISTRATION_STATUS));

// ── Phase 1 — Engagement layer ───────────────────────────────────────
// Agenda is embedded on Event (not a separate collection) — same
// "flat unless there's a real reason to split" reasoning ORGANIZER_ROLES
// above already documents for this module. Capped at 30 so a single
// multi-day fest's schedule fits without needing pagination.
const AGENDA_MAX_ITEMS = 30;

// Matches ResourceRating's 1–5 scale exactly (learning/models/ResourceRating.js)
// — reused as named constants here instead of magic numbers so
// EventFeedback's schema and its validator can't silently drift apart.
const FEEDBACK_RATING_MIN = 1;
const FEEDBACK_RATING_MAX = 5;

module.exports = {
  EVENT_STATUS,
  EVENT_STATUS_VALUES,
  EVENT_CATEGORIES,
  ORGANIZER_ROLES,
  ARCHIVE_AFTER_DAYS,
  REGISTRATION_STATUS,
  REGISTRATION_STATUS_VALUES,
  AGENDA_MAX_ITEMS,
  FEEDBACK_RATING_MIN,
  FEEDBACK_RATING_MAX
};