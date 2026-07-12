// backend/src/modules/learning/validators/resourceEngagement.validator.js
//
// NEW MODULE — Learning (Academic Learning domain, Phase 3).
// Same style as subject.validator.js/resource.validator.js — one Joi
// schema per route, stripUnknown:true, req.body/params overwritten with
// sanitized value.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const resourceIdParamSchema = Joi.object({
  resourceId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "resourceId must be a valid id" })
});

const commentIdParamSchema = Joi.object({
  commentId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "commentId must be a valid id" })
});

const rateResourceSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  review: Joi.string().trim().max(500).allow("").optional()
});

const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required(),
  parentCommentId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(null).optional()
});

const editCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(1000).required()
});

const cursorQuerySchema = Joi.object({
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateResourceIdParam = (req, res, next) => {
  const { error } = resourceIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateCommentIdParam = (req, res, next) => {
  const { error } = commentIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateRateResource = (req, res, next) => {
  const { error, value } = rateResourceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCreateComment = (req, res, next) => {
  const { error, value } = createCommentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateEditComment = (req, res, next) => {
  const { error, value } = editCommentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCursorQuery = (req, res, next) => {
  const { error, value } = cursorQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateResourceIdParam,
  validateCommentIdParam,
  validateRateResource,
  validateCreateComment,
  validateEditComment,
  validateCursorQuery
};