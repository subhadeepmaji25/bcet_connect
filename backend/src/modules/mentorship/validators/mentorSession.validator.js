// backend/src/modules/mentorship/validators/mentorSession.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { MEETING_MODES, SESSION_DURATIONS, LIMITS } = require("../constants/mentor.constants");
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const scheduleSessionSchema = Joi.object({
  requestId: Joi.string().pattern(OBJECT_ID_PATTERN).required().messages({
    "string.pattern.base": "requestId must be a valid id"
  }),
  scheduledAt: Joi.date().iso().greater("now").required().messages({
    "date.greater": "scheduledAt must be a future date/time"
  }),
  duration: Joi.number().valid(...SESSION_DURATIONS).optional(),
  mode: Joi.string().valid(...MEETING_MODES).optional(),
  meetingLink: Joi.string().trim().uri().allow("").optional(),
  notes: Joi.string().trim().max(LIMITS.MEETING_NOTE_MAX).allow("").optional()
});

const cancelSessionSchema = Joi.object({
  reason: Joi.string().trim().max(LIMITS.REJECTION_REASON_MAX).allow("").optional()
});

const validateScheduleSession = (req, res, next) => {
  const { error, value } = scheduleSessionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCancelSession = (req, res, next) => {
  const { error, value } = cancelSessionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = { validateScheduleSession, validateCancelSession };