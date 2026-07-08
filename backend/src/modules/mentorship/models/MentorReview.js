// backend/src/modules/mentorship/models/MentorReview.js
//
// One review per completed session. The `unique: true` on sessionId is
// enforced at the DATABASE level, not just checked in the service layer —
// this matters because a double-submit race (two rapid requests for the
// same session) would otherwise be able to slip past an application-level
// findOne-then-create check and create two reviews.

const mongoose = require("mongoose");
const { RATING, LIMITS } = require("../constants/mentor.constants");

const mentorReviewSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: "MentorSession", required: true, unique: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    rating: { type: Number, min: RATING.MIN, max: RATING.MAX, required: true },
    feedback: { type: String, trim: true, maxlength: LIMITS.MEETING_NOTE_MAX, default: "" },

    // Reserved for a future "post anonymously" option — when true, the
    // controller/service layer strips studentId before returning this
    // review in any mentor-facing or public listing. The field is always
    // stored regardless (never redacted from the DB itself), so moderation
    // can still trace abuse back to a real user if needed.
    anonymous: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

// A mentor's public review list, newest first — the most common read,
// used both by the public mentor-profile page and getMentorReviews().
mentorReviewSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model("MentorReview", mentorReviewSchema);