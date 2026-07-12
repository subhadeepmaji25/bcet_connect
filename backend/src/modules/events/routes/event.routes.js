// backend/src/modules/events/routes/event.routes.js
//
// UPDATED (Phase 2 — career lifecycle): This file previously mounted
// only event.controller.js and eventRegistration.controller.js.
// eventFeedback.controller.js, eventBookmark.controller.js,
// eventAttendance.controller.js, and eventCertificate.controller.js all
// existed fully built (services + validators + notification hooks) but
// had zero routes pointing at them — confirmed via grep, none of those
// four controller files were require()'d anywhere in this file. That
// made QR check-in, certificate issuance, feedback, and bookmarks
// unreachable from any client despite being "done" on the backend.
// This pass wires all of them in, following the exact ordering
// discipline the original file already established: every literal path
// segment (bookmarks/my, attendance/my, certificates/my, etc.) is
// registered BEFORE the catch-all "/:eventId" GET at the bottom, same
// rule job.routes.js follows.

const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { eventActionLimiter } = require("../../../shared/security/rateLimiters");

const {
  validateCreateEvent,
  validateUpdateEvent,
  validateRejectEvent,
  validateCancelEvent
} = require("../validators/event.validator");

const { validateListRegistrationsQuery } = require("../validators/eventRegistration.validator");

// Phase 1 — Engagement layer validators
const { validateSubmitFeedback, validateListFeedbackQuery } = require("../validators/eventFeedback.validator");

// Phase 2 — Career lifecycle validators
const {
  validateCheckInByToken,
  validateCheckInManually,
  validateListAttendanceQuery
} = require("../validators/eventAttendance.validator");
const { validateIssueCertificate, validateListCertificatesQuery } = require("../validators/eventCertificate.validator");

const {
  createEventController,
  updateEventController,
  deleteEventController,
  approveEventController,
  rejectEventController,
  cancelEventController,
  getAnalyticsController,
  getApprovedEventsController,
  getPendingEventsController,
  getMyEventsController,
  getEventByIdController
} = require("../controllers/event.controller");

const {
  registerForEventController,
  cancelRegistrationController,
  getMyRegistrationsController,
  getEventRegistrationsController
} = require("../controllers/eventRegistration.controller");

// Phase 1 — Engagement layer controllers
const {
  submitFeedbackController,
  getEventFeedbackController,
  getMyFeedbackForEventController
} = require("../controllers/eventFeedback.controller");

const {
  toggleBookmarkController,
  getMyBookmarksController
} = require("../controllers/eventBookmark.controller");

// Phase 2 — Career lifecycle controllers
const {
  generateCheckInTokenController,
  checkInByTokenController,
  checkInManuallyController,
  getEventAttendanceController,
  getMyAttendanceController
} = require("../controllers/eventAttendance.controller");

const {
  issueCertificateController,
  issueCertificatesForAllAttendeesController,
  getMyCertificatesController,
  getCertificateForEventController
} = require("../controllers/eventCertificate.controller");

// ── Reads (public-to-authenticated, ordered before "/:eventId" so
//    these literal segments never get swallowed as an :eventId param) ──

router.get("/", authMiddleware, getApprovedEventsController);

router.get(
  "/organizer/my",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  getMyEventsController
);

router.get(
  "/admin/pending",
  authMiddleware,
  allowRoles("admin"),
  getPendingEventsController
);

router.get(
  "/registrations/my",
  authMiddleware,
  getMyRegistrationsController
);

// Literal segments, same reason as above — must be registered before
// the catch-all "/:eventId" GET at the bottom of this file.
router.get(
  "/bookmarks/my",
  authMiddleware,
  getMyBookmarksController
);

router.get(
  "/attendance/my",
  authMiddleware,
  getMyAttendanceController
);

router.get(
  "/certificates/my",
  authMiddleware,
  validateListCertificatesQuery,
  getMyCertificatesController
);

// ── Writes ─────────────────────────────────────────────────────────────

router.post(
  "/",
  authMiddleware,
  eventActionLimiter,
  validateCreateEvent,
  createEventController
);

router.patch(
  "/:eventId",
  authMiddleware,
  validateUpdateEvent,
  updateEventController
);

router.delete(
  "/:eventId",
  authMiddleware,
  deleteEventController
);

router.patch(
  "/:eventId/approve",
  authMiddleware,
  allowRoles("admin"),
  approveEventController
);

router.patch(
  "/:eventId/reject",
  authMiddleware,
  allowRoles("admin"),
  validateRejectEvent,
  rejectEventController
);

router.patch(
  "/:eventId/cancel",
  authMiddleware,
  validateCancelEvent,
  cancelEventController
);

router.get(
  "/:eventId/analytics",
  authMiddleware,
  getAnalyticsController
);

// ── Registration sub-routes ────────────────────────────────────────────

router.post(
  "/:eventId/register",
  authMiddleware,
  allowRoles("student", "faculty", "alumni"),
  eventActionLimiter,
  registerForEventController
);

router.patch(
  "/:eventId/register/cancel",
  authMiddleware,
  cancelRegistrationController
);

router.get(
  "/:eventId/registrations",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  validateListRegistrationsQuery,
  getEventRegistrationsController
);

// ── Phase 1 — Feedback sub-routes ──────────────────────────────────────
// Open to anyone authenticated who registered — submitFeedback.service.js
// itself enforces "must have a CONFIRMED registration for a COMPLETED
// event", so no extra allowRoles() gate is needed here.

router.post(
  "/:eventId/feedback",
  authMiddleware,
  eventActionLimiter,
  validateSubmitFeedback,
  submitFeedbackController
);

router.get(
  "/:eventId/feedback",
  authMiddleware,
  validateListFeedbackQuery,
  getEventFeedbackController
);

router.get(
  "/:eventId/feedback/my",
  authMiddleware,
  getMyFeedbackForEventController
);

// ── Phase 1 — Bookmark sub-route ───────────────────────────────────────
// Single toggle endpoint, not separate add/remove — mirrors
// eventBookmark.service.js's toggleBookmark() being one function, not two.

router.post(
  "/:eventId/bookmark",
  authMiddleware,
  toggleBookmarkController
);

// ── Phase 2 — Attendance sub-routes ────────────────────────────────────

// Registrant-side: generates the QR payload token.
router.post(
  "/:eventId/attendance/token",
  authMiddleware,
  allowRoles("student", "faculty", "alumni"),
  generateCheckInTokenController
);

// Organizer/faculty-side: scans a registrant's QR and posts the decoded token.
router.post(
  "/:eventId/attendance/checkin/token",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  eventActionLimiter,
  validateCheckInByToken,
  checkInByTokenController
);

// Organizer/faculty-side fallback: manual roll-call by target userId.
router.post(
  "/:eventId/attendance/checkin/manual",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  eventActionLimiter,
  validateCheckInManually,
  checkInManuallyController
);

router.get(
  "/:eventId/attendance",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  validateListAttendanceQuery,
  getEventAttendanceController
);

// ── Phase 2 — Certificate sub-routes ───────────────────────────────────

router.post(
  "/:eventId/certificates",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  eventActionLimiter,
  validateIssueCertificate,
  issueCertificateController
);

router.post(
  "/:eventId/certificates/bulk",
  authMiddleware,
  allowRoles("faculty", "alumni", "admin"),
  eventActionLimiter,
  issueCertificatesForAllAttendeesController
);

router.get(
  "/:eventId/certificate",
  authMiddleware,
  getCertificateForEventController
);

// Kept last — this is the catch-all ":eventId" read, everything above
// with a literal path segment (organizer/my, admin/pending,
// registrations/my, bookmarks/my, attendance/my, certificates/my) must
// be registered before it, same ordering rule job.routes.js already
// follows. Sub-routes like ":eventId/feedback" are safe above this line
// too, since Express matches the more specific "/:eventId/feedback"
// pattern before falling through to plain "/:eventId" for a request
// that actually has a second path segment.
router.get("/:eventId", authMiddleware, getEventByIdController);

module.exports = router;