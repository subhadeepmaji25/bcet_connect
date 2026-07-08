// backend/src/modules/connections/validators/connection.validator.js
//
// Structural validation only — same gatekeeper role as
// mentorRequest.validator.js. Never checks whether a connection already
// exists, whether the receiver is a valid/active user, or ownership.
// That's all connection.service.js's job.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { LIMITS } = require("../constants/connection.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const sendRequestSchema = Joi.object({
  receiverId: Joi.string().pattern(OBJECT_ID_PATTERN).required().messages({
    "string.pattern.base": "receiverId must be a valid id"
  }),
  message: Joi.string().trim().max(LIMITS.MESSAGE_MAX).allow("").optional()
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().trim().max(LIMITS.REJECTION_REASON_MAX).allow("").optional()
});

const noBodySchema = Joi.object({}).unknown(false);

const validateSendRequest = (req, res, next) => {
  const { error, value } = sendRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateRejectRequest = (req, res, next) => {
  const { error, value } = rejectRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateNoBody = (req, res, next) => {
  const { error, value } = noBodySchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateSendRequest,
  validateRejectRequest,
  validateAcceptRequest: validateNoBody,
  validateCancelRequest: validateNoBody
};