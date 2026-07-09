// backend/src/modules/mentorship/controllers/mentorSession.controller.js
//
// UNCHANGED — no controller-level change needed. computePhase() output
// (`phase`, `secondsUntilStart`/`secondsRemaining`) is already merged
// into the `data.session` object (getSessionById) or each item in
// `data.sessions` (getMySessions) at the service layer, so it flows
// through sendResponse() automatically. Reproduced here only so the
// file set stays complete and consistent.

const mentorSessionService = require("../services/mentorSession.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

const scheduleSessionController = asyncHandler(async (req, res) => {
  const result = await mentorSessionService.scheduleSession(req.user.id, req.body);
  logger.info("Mentorship session scheduled", { module: "Mentorship", mentorId: req.user.id });
  return sendResponse(res, { statusCode: 201, ...result });
});

const completeSessionController = asyncHandler(async (req, res) => {
  const result = await mentorSessionService.completeSession(req.user.id, req.params.sessionId);
  logger.info("Mentorship session completed", { module: "Mentorship", mentorId: req.user.id, sessionId: req.params.sessionId });
  return sendResponse(res, result);
});

const cancelSessionController = asyncHandler(async (req, res) => {
  const result = await mentorSessionService.cancelSession(req.user.id, req.params.sessionId, req.body.reason);
  logger.info("Mentorship session cancelled", { module: "Mentorship", userId: req.user.id, sessionId: req.params.sessionId });
  return sendResponse(res, result);
});

const resolveRole = (userRole, requestedAs) => {
  if (userRole === "student") return "student";
  if (userRole === "faculty" || userRole === "admin") return "mentor";
  if (requestedAs === "student" || requestedAs === "mentor") return requestedAs;
  return "mentor";
};

const getMySessionsController = asyncHandler(async (req, res) => {
  const requestedAs = req.query.as;

  if (req.user.role === "alumni" && requestedAs === "all") {
    const [asStudent, asMentor] = await Promise.all([
      mentorSessionService.getMySessions(req.user.id, "student", req.query),
      mentorSessionService.getMySessions(req.user.id, "mentor", req.query)
    ]);

    const sessions = [...asStudent.sessions, ...asMentor.sessions].sort(
      (a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)
    );

    return sendResponse(res, {
      success: true,
      message: "Sessions fetched",
      data: { sessions },
      meta: {
        pagination: {
          total: asStudent.pagination.total + asMentor.pagination.total,
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 10
        }
      }
    });
  }

  const role = resolveRole(req.user.role, requestedAs);
  const result = await mentorSessionService.getMySessions(req.user.id, role, req.query);

  return sendResponse(res, {
    success: true,
    message: "Sessions fetched",
    data: { sessions: result.sessions },
    meta: { pagination: result.pagination }
  });
});

const getSessionByIdController = asyncHandler(async (req, res) => {
  const result = await mentorSessionService.getSessionById(req.params.sessionId, req.user.id);
  return sendResponse(res, result);
});

module.exports = {
  scheduleSessionController,
  completeSessionController,
  cancelSessionController,
  getMySessionsController,
  getSessionByIdController
};