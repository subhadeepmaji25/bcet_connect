// backend/src/modules/communities/validators/communityJoinRequest.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { LIMITS } = require("../constants/community.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const createRequestSchema = Joi.object({
  message: Joi.string().trim().max(LIMITS.JOIN_MESSAGE_MAX).allow("").optional()
});

const rejectRequestSchema = Joi.object({
  reason: Joi.string().trim().max(300).allow("").optional()
});

const requestIdParamSchema = Joi.object({
  requestId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "requestId must be a valid id" })
});

const validateCreateRequest = (req, res, next) => {
  const { error, value } = createRequestSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
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

const validateRequestIdParam = (req, res, next) => {
  const { error } = requestIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

module.exports = { validateCreateRequest, validateRejectRequest, validateRequestIdParam };