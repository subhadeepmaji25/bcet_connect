// backend/src/modules/admin/validators/adminModeration.validator.js
const Joi = require("joi");
const mongoose = require("mongoose");
const ApiError = require("../../../shared/errors/ApiError");

const objectIdParam = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error("any.invalid");
  return value;
}, "ObjectId validation").messages({ "any.invalid": "Invalid ID format" });

const reportIdParamSchema = Joi.object({ reportId: objectIdParam.required() });
const postIdParamSchema = Joi.object({ postId: objectIdParam.required() });
const communityIdParamSchema = Joi.object({ communityId: objectIdParam.required() });

const resolveReportBodySchema = Joi.object({
  action: Joi.string().valid("resolve", "dismiss").required(),
  reason: Joi.string().trim().min(5).max(500).allow("").optional()
});

const reasonBodySchema = Joi.object({
  reason: Joi.string().trim().min(5).max(500).allow("").optional()
});

const validateReportIdParam = (req, res, next) => {
  const { error, value } = reportIdParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validatePostIdParam = (req, res, next) => {
  const { error, value } = postIdParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validateCommunityIdParam = (req, res, next) => {
  const { error, value } = communityIdParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validateResolveReportBody = (req, res, next) => {
  const { error, value } = resolveReportBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateModerationReasonBody = (req, res, next) => {
  const { error, value } = reasonBodySchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateReportIdParam,
  validatePostIdParam,
  validateCommunityIdParam,
  validateResolveReportBody,
  validateModerationReasonBody
};