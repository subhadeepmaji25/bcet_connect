// backend/src/modules/learning/validators/learningProgress.validator.js

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const resourceIdParamSchema = Joi.object({
  resourceId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "resourceId must be a valid id" })
});

const updateProgressSchema = Joi.object({
  status: Joi.string().valid("started", "in_progress", "completed").optional(),
  completionPercent: Joi.number().min(0).max(100).optional()
}).min(1);

const continueLearningQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(30).optional()
});

const validateResourceIdParam = (req, res, next) => {
  const { error } = resourceIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateUpdateProgress = (req, res, next) => {
  const { error, value } = updateProgressSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateContinueLearningQuery = (req, res, next) => {
  const { error, value } = continueLearningQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateResourceIdParam,
  validateUpdateProgress,
  validateContinueLearningQuery
};