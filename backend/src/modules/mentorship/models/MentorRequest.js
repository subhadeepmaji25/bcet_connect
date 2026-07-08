// backend/src/modules/mentorship/models/MentorRequest.js
const mongoose = require("mongoose");
const {
  REQUEST_STATUS,
  REQUEST_STATUS_VALUES,
  MEETING_MODES,
  DEFAULT_MEETING_MODE,
  SESSION_DURATIONS,
  DEFAULT_SESSION_DURATION
} = require("../constants/mentor.constants");

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: REQUEST_STATUS_VALUES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const mentorRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null, index: true },
    topic: { type: String, trim: true, required: true },
    message: { type: String, trim: true, required: true },
    preferredDomain: { type: String, trim: true, default: "" },
    preferredSlot: { type: String, trim: true, default: "" },
    mode: { type: String, enum: MEETING_MODES, default: DEFAULT_MEETING_MODE },
    duration: { type: Number, enum: SESSION_DURATIONS, default: DEFAULT_SESSION_DURATION },
    status: { type: String, enum: REQUEST_STATUS_VALUES, default: REQUEST_STATUS.PENDING, index: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    respondedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: "" },
    meetingNote: { type: String, trim: true, default: "" }
  },
  { timestamps: true, versionKey: false }
);

mentorRequestSchema.index({ studentId: 1, status: 1 });
mentorRequestSchema.index({ mentorId: 1, status: 1 });

module.exports = mongoose.model("MentorRequest", mentorRequestSchema);