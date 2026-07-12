// backend/src/modules/events/models/EventFeedback.js
const mongoose = require("mongoose");
const { FEEDBACK_RATING_MIN, FEEDBACK_RATING_MAX } = require("../constants/event.constants");

// Mirrors Learning's ResourceRating shape exactly (see
// learning/models/ResourceRating.js) — same one-review-per-user-per-item
// pattern, just eventId instead of resourceId. Kept as its own collection
// rather than embedded on Event so a feedback submission never has to
// rewrite the whole Event document (and re-check its indexes) the way an
// embedded array field would.
const eventFeedbackSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, min: FEEDBACK_RATING_MIN, max: FEEDBACK_RATING_MAX, required: true },
    review: { type: String, trim: true, maxlength: 500, default: "" }
  },
  { timestamps: true, versionKey: false }
);

// One feedback entry per user per event — same unique-compound-index
// pattern EventRegistration and ResourceRating already use. Re-submitting
// feedback should update the existing row (see eventFeedback.service.js),
// never create a second one.
eventFeedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Supports "latest feedback first" on an event's feedback list without a
// collection scan — same shape as EventRegistration's (eventId, status) index.
eventFeedbackSchema.index({ eventId: 1, createdAt: -1 });

module.exports = mongoose.model("EventFeedback", eventFeedbackSchema);