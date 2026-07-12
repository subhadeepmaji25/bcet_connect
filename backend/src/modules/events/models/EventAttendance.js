// backend/src/modules/events/models/EventAttendance.js
const mongoose = require("mongoose");

// Deliberately a separate collection from EventRegistration, not a
// status value bolted onto it. Registration is intent ("I plan to
// attend" — created at registration time, before the event even
// happens). Attendance is fact ("I was actually present" — created only
// at/after the event, by someone other than the attendee). Merging the
// two would mean either overloading REGISTRATION_STATUS with a meaning
// it was never designed for, or letting a student mark their own
// attendance by editing their own registration row — both wrong.
//
// The invariant "an attendance row should only exist for a confirmed
// registration" is enforced in eventAttendance.service.js at write time,
// not here — same "service owns cross-document rules, model stays a
// dumb shape" discipline the rest of this module already follows
// (see promoteNextWaitlisted() in eventRegistration.service.js).
const eventAttendanceSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    checkedInAt: { type: Date, default: Date.now },
    // Who performed the check-in (QR scan or manual mark) — always
    // faculty/organizer/admin, never the attendee. Self-marked attendance
    // would defeat the entire point of this collection existing.
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);

// One attendance record per user per event — scanning the same QR twice
// (accidental double-scan) must not create a second row.
eventAttendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Supports an organizer's live "who's checked in so far" list, ordered
// by arrival, without a collection scan.
eventAttendanceSchema.index({ eventId: 1, checkedInAt: 1 });

module.exports = mongoose.model("EventAttendance", eventAttendanceSchema);