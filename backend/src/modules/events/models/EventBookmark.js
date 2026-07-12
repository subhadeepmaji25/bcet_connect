// backend/src/modules/events/models/EventBookmark.js
const mongoose = require("mongoose");

// Mirrors Learning's ResourceBookmark shape exactly (see
// learning/models/ResourceBookmark.js) — a bare join collection, no
// extra fields needed beyond who-bookmarked-what-when. Kept separate
// from EventRegistration on purpose: a bookmark is "save for later
// browsing", a registration is a real seat commitment — conflating them
// would make registrationCount/waitlistCount drift against what actually
// happened at the event.
const eventBookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true }
  },
  { timestamps: true, versionKey: false }
);

// One bookmark per user per event — toggling bookmark "on" twice should
// be a no-op, not a duplicate row.
eventBookmarkSchema.index({ userId: 1, eventId: 1 }, { unique: true });
// Supports "my bookmarks, most recent first" without a collection scan —
// same shape as ResourceBookmark's (userId, createdAt) index.
eventBookmarkSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("EventBookmark", eventBookmarkSchema);