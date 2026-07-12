// backend/src/modules/events/controllers/eventAttendance.controller.js
const attendanceService = require("../services/eventAttendance.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

// Registrant-side: generates the token that gets rendered into a QR
// code on the frontend — same "backend only ever deals in the token"
// split the service layer already documents.
const generateCheckInTokenController = asyncHandler(async (req, res) => {
  const result = await attendanceService.generateCheckInToken(req.params.eventId, req.user.id);
  return sendResponse(res, result);
});

// Organizer/faculty-side: scans a registrant's QR and posts the decoded
// token here to record attendance.
const checkInByTokenController = asyncHandler(async (req, res) => {
  const result = await attendanceService.checkInByToken(req.body.token, req.user.id);
  logger.info("Event check-in via token", { module: "Events", checkedInBy: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

// Organizer/faculty-side fallback: manual roll-call by target userId,
// no QR/token involved — same organizer-or-admin gate the service enforces.
const checkInManuallyController = asyncHandler(async (req, res) => {
  const result = await attendanceService.checkInManually(
    req.params.eventId,
    req.body.userId,
    req.user.id,
    req.user.role
  );
  logger.info("Event check-in via manual roll-call", {
    module: "Events",
    checkedInBy: req.user.id,
    targetUserId: req.body.userId,
    eventId: req.params.eventId
  });
  return sendResponse(res, result);
});

const getEventAttendanceController = asyncHandler(async (req, res) => {
  const result = await attendanceService.getEventAttendance(
    req.params.eventId, req.user.id, req.user.role, req.query
  );
  return sendResponse(res, {
    success: true,
    message: "Event attendance fetched successfully",
    data: { attendance: result.attendance },
    meta: { pagination: result.pagination }
  });
});

const getMyAttendanceController = asyncHandler(async (req, res) => {
  const result = await attendanceService.getMyAttendance(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your attendance history fetched",
    data: { attendance: result.attendance },
    meta: { pagination: result.pagination }
  });
});

module.exports = {
  generateCheckInTokenController,
  checkInByTokenController,
  checkInManuallyController,
  getEventAttendanceController,
  getMyAttendanceController
};