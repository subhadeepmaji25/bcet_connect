// backend/src/modules/events/services/eventCertificate.service.js
//
// REQUIRES a new dependency: `npm install pdfkit --save` in backend/.
// Not installed yet — media.constants.js already has MEDIA_TYPES.CERTIFICATE
// fully configured (folder "certificates", "raw" resource type, 5MB cap),
// same as EVENT_BANNER was pre-configured but unwired before Phase 0.
// Lazy-required below (not at top of file) so the rest of this module
// keeps working even before pdfkit is installed — only certificate
// issuance itself fails, with an explicit hint, same pattern
// upload.middleware.js already uses for a missing `file-type` package.

const Event = require("../models/Event");
const EventAttendance = require("../models/EventAttendance");
const EventCertificate = require("../models/EventCertificate");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { EVENT_STATUS } = require("../constants/event.constants");
const { uploadMedia, replaceMedia } = require("../../../shared/media/media.service");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
// This is the actual BCET Connect "career lifecycle" hook discussed
// earlier: issuing a certificate re-runs the same profile-intelligence
// sync avatar.service.js's uploadAvatar() triggers, so a certificate
// shows up in profileCompletion / SearchProfile the same turn it's
// issued, not on some later background pass.
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");

const getPdfKit = () => {
  try {
    // eslint-disable-next-line global-require
    return require("pdfkit");
  } catch (err) {
    logger.error("pdfkit is not installed — certificate generation unavailable", {
      module: "EventCertificate",
      hint: "Run `npm install pdfkit --save` in backend/ — required for certificate PDF generation.",
      error: err.message
    });
    throw ApiError.internal("Certificate generation is temporarily unavailable. Please try again later.");
  }
};

// Simple single-page landscape certificate — deliberately minimal
// (no logo/signature images) so this works out of the box without extra
// asset files; swap in a branded template later without touching the
// calling code below.
const buildCertificatePdfBuffer = ({ recipientName, eventTitle, eventDate, organizerName }) => {
  const PDFDocument = getPdfKit();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(28).text("Certificate of Participation", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(16).text("This is to certify that", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(24).text(recipientName, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(16).text(`participated in "${eventTitle}"`, { align: "center" });
    doc.fontSize(14).text(`held on ${eventDate}`, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).text(`Organized by ${organizerName}`, { align: "center" });

    doc.end();
  });
};

// ── Single issue ──────────────────────────────────────────────────────
// Callable by the organizer/admin, or by the completeEvents() cron later
// if auto-issue-on-completion is wanted — kept as a plain function (not
// tied to the HTTP layer) for exactly that reuse.
const issueCertificate = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false })
    .populate("organizedBy", "username fullName")
    .lean();
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== EVENT_STATUS.COMPLETED) {
    throw ApiError.badRequest("Certificates can only be issued once an event is completed");
  }

  const attendance = await EventAttendance.findOne({ eventId, userId }).lean();
  if (!attendance) {
    throw ApiError.forbidden("Only attendees with a recorded check-in can receive a certificate");
  }

  const User = require("../../auth/models/User");
  const recipient = await User.findById(userId).select("username fullName").lean();
  if (!recipient) throw ApiError.notFound("User not found");

  const pdfBuffer = await buildCertificatePdfBuffer({
    recipientName: recipient.fullName || recipient.username,
    eventTitle: event.title,
    eventDate: new Date(event.startTime).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
    organizerName: event.organizedBy?.fullName || event.organizedBy?.username || "BCET Connect"
  });

  const existing = await EventCertificate.findOne({ eventId, userId });

  // Same replaceMedia()-if-exists-else-uploadMedia() branch
  // uploadEventBanner() already uses — a re-issue (e.g. name correction)
  // overwrites the old Cloudinary object instead of leaking an orphan.
  const uploaded = existing
    ? await replaceMedia(
        MEDIA_TYPES.CERTIFICATE,
        userId,
        { buffer: pdfBuffer, mimeType: "application/pdf", sizeInBytes: pdfBuffer.length, originalName: `${event.title}-certificate.pdf` },
        existing.certificatePublicId
      )
    : await uploadMedia(
        MEDIA_TYPES.CERTIFICATE,
        userId,
        { buffer: pdfBuffer, mimeType: "application/pdf", sizeInBytes: pdfBuffer.length, originalName: `${event.title}-certificate.pdf` }
      );

  const certificate = await EventCertificate.findOneAndUpdate(
    { eventId, userId },
    { $set: { certificateUrl: uploaded.url, certificatePublicId: uploaded.publicId, issuedAt: new Date() } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await notify(NOTIFICATION_EVENTS.EVENT_CERTIFICATE_ISSUED, {
    userId,
    data: { eventTitle: event.title },
    meta: { eventId }
  });

  // Fire-and-forget-adjacent: awaited so profileCompletion is fresh by
  // the time this response goes out, but its own internal try/catch
  // (see syncUserIntelligence.js) means a sync failure never fails
  // certificate issuance itself.
  await syncUserIntelligence(userId);

  return { success: true, message: "Certificate issued successfully", data: { certificate } };
};

// ── Bulk issue ────────────────────────────────────────────────────────
// One organizer action ("issue all") instead of clicking through every
// attendee individually — same batch-via-Promise.all pattern
// cancelEvent() already uses to notify every registrant at once.
const issueCertificatesForAllAttendees = async (eventId, requesterId, requesterRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("organizedBy status").lean();
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== "admin") {
    throw ApiError.forbidden("Only the organizer or an admin can issue certificates for this event");
  }
  if (event.status !== EVENT_STATUS.COMPLETED) {
    throw ApiError.badRequest("Certificates can only be issued once an event is completed");
  }

  const attendees = await EventAttendance.find({ eventId }).select("userId").lean();

  const results = await Promise.allSettled(
    attendees.map((a) => issueCertificate(eventId, a.userId))
  );

  const issuedCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.length - issuedCount;

  return {
    success: true,
    message: `Issued ${issuedCount} certificate(s)${failedCount ? `, ${failedCount} failed` : ""}`,
    data: { issuedCount, failedCount, totalAttendees: attendees.length }
  };
};

const getMyCertificates = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [certificates, total] = await Promise.all([
    EventCertificate.find({ userId })
      .sort({ issuedAt: -1 }).skip(skip).limit(Number(limit))
      .populate("eventId", "title startTime category").lean(),
    EventCertificate.countDocuments({ userId })
  ]);
  return { certificates, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getCertificateForEvent = async (eventId, userId) => {
  const certificate = await EventCertificate.findOne({ eventId, userId }).lean();
  if (!certificate) throw ApiError.notFound("No certificate found for this event");
  return { success: true, message: "Certificate fetched", data: { certificate } };
};

module.exports = {
  issueCertificate,
  issueCertificatesForAllAttendees,
  getMyCertificates,
  getCertificateForEvent
};