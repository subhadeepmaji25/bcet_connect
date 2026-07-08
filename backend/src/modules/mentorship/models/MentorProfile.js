// backend/src/modules/mentorship/models/MentorProfile.js
const mongoose = require("mongoose");
const {
  MENTOR_STATUS, MENTOR_STATUS_VALUES,
  VERIFICATION_STATUS, VERIFICATION_STATUS_VALUES,
  EXPERTISE_DOMAINS, SUPPORTED_LANGUAGES, AVAILABILITY_DAYS,
  SESSION_DURATIONS, DEFAULT_SESSION_DURATION, RATING
} = require("../constants/mentor.constants");

const availabilitySlotSchema = new mongoose.Schema({
  day: { type: String, enum: AVAILABILITY_DAYS, required: true },
  startTime: { type: String, required: true, trim: true },
  endTime: { type: String, required: true, trim: true },
  slotDuration: { type: Number, enum: SESSION_DURATIONS, default: DEFAULT_SESSION_DURATION }
}, { _id: false });

const mentorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  mentorRole: { type: String, enum: ["faculty", "alumni"], required: true },
  bio: { type: String, trim: true, maxlength: 1000, default: "" },
  domains: { type: [{ type: String, enum: EXPERTISE_DOMAINS }], default: [] },
  languages: { type: [{ type: String, enum: SUPPORTED_LANGUAGES }], default: [] },
  yearsExperience: { type: Number, min: 0, max: 50, default: 0 },
  company: { type: String, trim: true, default: "" },
  designation: { type: String, trim: true, default: "" },
  availability: { type: [availabilitySlotSchema], default: [] },

  // NEW — mentorship ke liye ALAG visibility control, general Profile.visibility se independent.
  // "public"  → mentors listing + search + public profile page pe dikhega
  // "private" → mentor list se hidden, sirf khud ko aur admin ko dikhega
  profileVisibility: {
    type: String,
    enum: ["public", "private"],
    default: "public",
    index: true
  },

  mentorStatus: { type: String, enum: MENTOR_STATUS_VALUES, default: MENTOR_STATUS.ACTIVE, index: true },
  verificationStatus: { type: String, enum: VERIFICATION_STATUS_VALUES, default: VERIFICATION_STATUS.PENDING, index: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  verifiedAt: { type: Date, default: null },
  rating: { type: Number, min: RATING.MIN, max: RATING.MAX, default: RATING.DEFAULT },
  reviewCount: { type: Number, default: 0 },
  totalSessions: { type: Number, default: 0 }
}, { timestamps: true, versionKey: false });

mentorProfileSchema.index({ domains: 1 });
mentorProfileSchema.index({ mentorStatus: 1, verificationStatus: 1, profileVisibility: 1 });

module.exports = mongoose.model("MentorProfile", mentorProfileSchema);