// backend/src/modules/mentorship/models/MentorSession.js
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

module.exports = mongoose.model("MentorSession", mentorSessionSchema);