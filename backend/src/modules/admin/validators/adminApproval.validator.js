// backend/src/modules/admin/validators/adminApproval.validator.js
const Joi = require("joi");
const mongoose = require("mongoose");
const ApiError = require("../../../shared/errors/ApiError");
const { APPROVAL_QUEUE_TYPE_VALUES } = require("../constants/admin.constants");

const objectIdParam = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation").messages({
  "any.invalid": "Invalid ID format"
});

const queueTypeParamSchema = Joi.object({
  type: Joi.string().valid(...APPROVAL_QUEUE_TYPE_VALUES).required()
});

const decideParamSchema = Joi.object({
  type: Joi.string().valid(...APPROVAL_QUEUE_TYPE_VALUES).required(),
  itemId: objectIdParam.required()
});

const decideBodySchema = Joi.object({
  decision: Joi.string().valid("approve", "reject").required(),
  reason: Joi.string().trim().min(5).max(500).when("decision", {
    is: "reject",
    then: Joi.required(),
    otherwise: Joi.optional().allow("")
  })
});

const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const validateQueueTypeParam = (req, res, next) => {
  const { error, value } = queueTypeParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validateDecideParams = (req, res, next) => {
  const { error, value } = decideParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validateDecideBody = (req, res, next) => {
  const { error, value } = decideBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validatePaginationQuery = (req, res, next) => {
  const { error, value } = paginationQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateQueueTypeParam,
  validateDecideParams,
  validateDecideBody,
  validatePaginationQuery
};