// backend/src/modules/mentorship/validators/mentorRequest.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { MENTORSHIP_TOPICS, EXPERTISE_DOMAINS, MEETING_MODES, SESSION_DURATIONS, LIMITS } = require("../constants/mentor.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const createRequestSchema = Joi.object({
  mentorId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "mentorId must be a valid id" }),
  topic: Joi.string().trim().lowercase().min(LIMITS.TOPIC_MIN).max(LIMITS.TOPIC_MAX).required(),
  message: Joi.string().trim().min(LIMITS.MESSAGE_MIN).max(LIMITS.MESSAGE_MAX).required(),
  // FIXED — pehle empty string "" bhejte hi 400 error aata tha kyunki .allow("") missing tha.
  // Frontend jab dropdown "Select domain (optional)" ko unselected chhod deta hai, wo "" bhejta hai.
  preferredDomain: Joi.string().trim().lowercase().valid(...EXPERTISE_DOMAINS).allow("").optional(),
  preferredSlot: Joi.string().trim().max(50).allow("").optional(),
  mode: Joi.string().valid(...MEETING_MODES).optional(),
  duration: Joi.number().valid(...SESSION_DURATIONS).optional()
});

const acceptRequestSchema = Joi.object({
  meetingNote: Joi.string().trim().max(LIMITS.MEETING_NOTE_MAX).allow("").optional()
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().trim().max(LIMITS.REJECTION_REASON_MAX).allow("").optional()
});

const cancelRequestSchema = Joi.object({}).unknown(false);

const validateCreateRequest = (req, res, next) => {
  const { error, value } = createRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  // FIXED — empty string ko backend/DB tak nahi bhejte, undefined kar dete hain
  // taaki Joi.valid(...EXPERTISE_DOMAINS) enum check future queries me bhi clean rahe.
  if (value.preferredDomain === "") delete value.preferredDomain;
  req.body = value;
  next();
};

const validateAcceptRequest = (req, res, next) => {
  const { error, value } = acceptRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateRejectRequest = (req, res, next) => {
  const { error, value } = rejectRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCancelRequest = (req, res, next) => {
  const { error, value } = cancelRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = { validateCreateRequest, validateAcceptRequest, validateRejectRequest, validateCancelRequest };