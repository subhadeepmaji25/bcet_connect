// backend/src/modules/feed/validators/feedReport.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const {
  REPORT_TARGET_TYPE_VALUES,
  REPORT_REASON_VALUES,
  REPORT_STATUS_VALUES,
  LIMITS
} = require("../constants/feed.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const createReportSchema = Joi.object({
  targetType: Joi.string().valid(...REPORT_TARGET_TYPE_VALUES).required(),
  targetId: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
  reason: Joi.string().valid(...REPORT_REASON_VALUES).required(),
  note: Joi.string().trim().max(LIMITS.REPORT_NOTE_MAX).allow("").optional()
});

const reportIdParamSchema = Joi.object({
  reportId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

const reportsQuerySchema = Joi.object({
  status: Joi.string().valid(...REPORT_STATUS_VALUES).optional(),
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(30).optional()
});

const resolveReportSchema = Joi.object({
  status: Joi.string().valid("resolved", "dismissed").required(),
  action: Joi.string().valid("none", "hide", "restore").default("none"),
  resolutionNote: Joi.string().trim().max(LIMITS.REPORT_NOTE_MAX).allow("").optional()
});

const validateCreateReport = (req, res, next) => {
  const { error, value } = createReportSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateReportIdParam = (req, res, next) => {
  const { error } = reportIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateReportsQuery = (req, res, next) => {
  const { error, value } = reportsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

const validateResolveReport = (req, res, next) => {
  const { error, value } = resolveReportSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateCreateReport,
  validateReportIdParam,
  validateReportsQuery,
  validateResolveReport
};
