// backend/src/modules/events/controllers/eventCertificate.controller.js
const certificateService = require("../services/eventCertificate.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

// Organizer/admin issues a certificate for one attendee at a time —
// req.body.userId is the target attendee, not the caller.
const issueCertificateController = asyncHandler(async (req, res) => {
  const result = await certificateService.issueCertificate(req.params.eventId, req.body.userId);
  logger.info("Event certificate issued", {
    module: "Events",
    issuedBy: req.user.id,
    targetUserId: req.body.userId,
    eventId: req.params.eventId
  });
  return sendResponse(res, { statusCode: 201, ...result });
});

// Organizer/admin bulk action — issues to every recorded attendee at once.
const issueCertificatesForAllAttendeesController = asyncHandler(async (req, res) => {
  const result = await certificateService.issueCertificatesForAllAttendees(
    req.params.eventId, req.user.id, req.user.role
  );
  logger.info("Event certificates bulk-issued", { module: "Events", issuedBy: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const getMyCertificatesController = asyncHandler(async (req, res) => {
  const result = await certificateService.getMyCertificates(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your certificates fetched",
    data: { certificates: result.certificates },
    meta: { pagination: result.pagination }
  });
});

const getCertificateForEventController = asyncHandler(async (req, res) => {
  const result = await certificateService.getCertificateForEvent(req.params.eventId, req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  issueCertificateController,
  issueCertificatesForAllAttendeesController,
  getMyCertificatesController,
  getCertificateForEventController
};