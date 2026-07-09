// backend/src/modules/mentorship/models/MentorSession.js
//
// UPDATED: added `endsAt`, computed once at schedule-time as
// scheduledAt + duration (minutes) and stored, not recalculated on every
// read. This lets the cron query `{ endsAt: { $lte: now } }` directly
// against an indexed field instead of loading every scheduled/live
// session into memory just to do the math — the query itself does the
// filtering at the database level.

const mongoose = require("mongoose");
const {
  SESSION_STATUS,
  SESSION_STATUS_VALUES,
  SESSION_DURATIONS,
  DEFAULT_SESSION_DURATION,
  MEETING_MODES,
  DEFAULT_MEETING_MODE,
  LIMITS
} = require("../constants/mentor.constants");

const mentorSessionSchema = new mongoose.Schema(
  {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: "MentorRequest", required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, trim: true, required: true },
    scheduledAt: { type: Date, required: true },
    // NEW — scheduledAt + duration, saved at create-time by
    // scheduleSession(). Never null once a session exists; default is
    // only here so Mongoose doesn't complain about missing-at-schema-
    // validation-time before the service sets it explicitly.
    endsAt: { type: Date, default: null, index: true },
    duration: { type: Number, enum: SESSION_DURATIONS, default: DEFAULT_SESSION_DURATION },
    mode: { type: String, enum: MEETING_MODES, default: DEFAULT_MEETING_MODE },
    meetingLink: { type: String, trim: true, default: "" },
    status: { type: String, enum: SESSION_STATUS_VALUES, default: SESSION_STATUS.SCHEDULED, index: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelReason: { type: String, trim: true, maxlength: LIMITS.REJECTION_REASON_MAX, default: "" },
    notes: { type: String, trim: true, maxlength: LIMITS.MEETING_NOTE_MAX, default: "" }
  },
  { timestamps: true, versionKey: false }
);

mentorSessionSchema.index({ mentorId: 1, status: 1, scheduledAt: 1 });
mentorSessionSchema.index({ studentId: 1, status: 1, scheduledAt: 1 });
mentorSessionSchema.index({ requestId: 1, status: 1 });
// NEW — the cron's core query shape: "sessions whose time-window has
// passed but are still in a non-terminal status". Compound on status +
// endsAt so it's a single index scan, not a collection scan filtered
// in memory.
mentorSessionSchema.index({ status: 1, endsAt: 1 });

module.exports = mongoose.model("MentorSession", mentorSessionSchema);