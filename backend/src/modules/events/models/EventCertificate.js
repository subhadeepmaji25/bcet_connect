// backend/src/modules/events/models/EventCertificate.js
const mongoose = require("mongoose");

// certificateUrl/certificatePublicId follow the exact bannerUrl/
// bannerPublicId pattern already on Event.js: the secure_url is what
// gets shown/downloaded, the public_id is what eventCertificate.service.js
// needs to delete or replace the file on Cloudinary if a certificate is
// ever re-issued (e.g. a name-correction re-issue), same as
// uploadEventBanner()'s replaceMedia() call.
//
// A certificate is only ever created after EventAttendance + Event
// COMPLETED both hold true — that gating lives in
// eventCertificate.service.js, not here, same "service owns
// cross-document invariants" rule EventAttendance's model comment
// documents.
const eventCertificateSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    certificateUrl: { type: String, required: true },
    certificatePublicId: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

// One certificate per user per event — a re-issue (e.g. after a
// name-correction) replaces this same document via replaceMedia(),
// rather than accumulating a second certificate for the same attendance.
eventCertificateSchema.index({ eventId: 1, userId: 1 }, { unique: true });
// Supports "my certificates, most recently issued first" — the same
// read shape a Resume/profile page would want to power a "certificates
// earned" section.
eventCertificateSchema.index({ userId: 1, issuedAt: -1 });

module.exports = mongoose.model("EventCertificate", eventCertificateSchema);