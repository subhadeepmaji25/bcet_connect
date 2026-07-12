// backend/src/modules/events/controllers/event.controller.js
const eventService = require("../services/event.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const createEventController = asyncHandler(async (req, res) => {
  const result = await eventService.createEvent(req.user.id, req.user.role, req.body);
  logger.info("Event created", { module: "Events", userId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const updateEventController = asyncHandler(async (req, res) => {
  const result = await eventService.updateEvent(req.params.eventId, req.user.id, req.body);
  logger.info("Event updated", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const deleteEventController = asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.eventId, req.user.id, req.user.role);
  logger.info("Event deleted", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const approveEventController = asyncHandler(async (req, res) => {
  const result = await eventService.approveEvent(req.params.eventId, req.user.id);
  logger.info("Event approved", { module: "Events", adminId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const rejectEventController = asyncHandler(async (req, res) => {
  const result = await eventService.rejectEvent(req.params.eventId, req.user.id, req.body.rejectionReason);
  logger.info("Event rejected", { module: "Events", adminId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const cancelEventController = asyncHandler(async (req, res) => {
  const result = await eventService.cancelEvent(req.params.eventId, req.user.id, req.user.role, req.body.cancelReason);
  logger.info("Event cancelled", { module: "Events", userId: req.user.id, eventId: req.params.eventId });
  return sendResponse(res, result);
});

const getAnalyticsController = asyncHandler(async (req, res) => {
  const result = await eventService.getAnalytics(req.params.eventId, req.user.id, req.user.role);
  return sendResponse(res, result);
});

const getApprovedEventsController = asyncHandler(async (req, res) => {
  const result = await eventService.getApprovedEvents(req.query);
  return sendResponse(res, {
    success: true,
    message: "Events fetched successfully",
    data: { events: result.events },
    meta: { pagination: result.pagination }
  });
});

const getPendingEventsController = asyncHandler(async (req, res) => {
  const result = await eventService.getPendingEvents(req.query);
  return sendResponse(res, {
    success: true,
    message: "Pending events fetched",
    data: { events: result.events },
    meta: { pagination: result.pagination }
  });
});

const getMyEventsController = asyncHandler(async (req, res) => {
  const result = await eventService.getMyEvents(req.user.id, req.query);
  return sendResponse(res, {
    success: true,
    message: "Your events fetched",
    data: { events: result.events },
    meta: { pagination: result.pagination }
  });
});

const getEventByIdController = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.eventId);
  return sendResponse(res, {
    success: true,
    message: "Event fetched successfully",
    data: { event }
  });
});

module.exports = {
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
};
