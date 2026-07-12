// backend/src/modules/events/controllers/eventRegistration.controller.js
const registrationService = require("../services/eventRegistration.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const registerForEventController = asyncHandler(async (req, res) => {
  const result = await registrationService.registerForEvent(req.params.eventId, req.user.id);
  logger.info("Event registration created", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, { statusCode: 201, ...result });
});

const cancelRegistrationController = asyncHandler(async (req, res) => {
  const result = await registrationService.cancelRegistration(req.params.eventId, req.user.id);
  logger.info("Event registration cancelled", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const getMyRegistrationsController = asyncHandler(async (req, res) => {
  const result = await registrationService.getMyRegistrations(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your registrations fetched",
    data: { registrations: result.registrations },
    meta: { pagination: result.pagination }
  });
});

const getEventRegistrationsController = asyncHandler(async (req, res) => {
  const result = await registrationService.getEventRegistrations(
    req.params.eventId, req.user.id, req.user.role, req.query
  );
  return sendResponse(res, {
    success: true,
    message: "Event registrations fetched",
    data: { registrations: result.registrations },
    meta: { pagination: result.pagination }
  });
});

module.exports = {
  registerForEventController,
  cancelRegistrationController,
  getMyRegistrationsController,
  getEventRegistrationsController
};
