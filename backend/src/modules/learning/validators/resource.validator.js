// backend/src/modules/learning/validators/resource.validator.js
//
// FIX (Phase 1c): listResourcesQuerySchema only allowed subjectId/type/
// page/limit — but listResourcesForStaff() (resource.service.js) now
// also accepts department/semester as optional filters for Faculty/
// Admin browsing. Without adding them here, stripUnknown:true would
// silently strip those query params before they ever reached the
// service, making the new staff filters unusable from the route layer.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const {
  RESOURCE_TYPE_VALUES,
  LINK_ONLY_TYPES,
  VISIBILITY_VALUES,
  DIFFICULTY_VALUES
} = require("../constants/resource.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const uploadResourceSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  type: Joi.string().valid(...RESOURCE_TYPE_VALUES).required(),
  subjectId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "subjectId must be a valid id" }),
  visibility: Joi.string().valid(...VISIBILITY_VALUES).optional(),
  section: Joi.string().trim().uppercase().max(5).allow("").optional(),
  externalUrl: Joi.when("type", {
    is: Joi.string().valid(...LINK_ONLY_TYPES),
    then: Joi.string().uri().required(),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "externalUrl is only allowed for video_link or reference_link resources"
    })
  }),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(15).optional(),
  difficulty: Joi.string().valid(...DIFFICULTY_VALUES).optional(),
  estimatedTimeMinutes: Joi.number().integer().min(0).max(1440).optional()
});

const verifyResourceSchema = Joi.object({
  decision: Joi.string().valid("verified", "rejected").required(),
  rejectionReason: Joi.string().trim().max(500).when("decision", {
    is: "rejected",
    then: Joi.string().min(5).required(),
    otherwise: Joi.string().allow("").optional()
  })
});

const resourceIdParamSchema = Joi.object({
  resourceId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "resourceId must be a valid id" })
});

// FIXED (Phase 1c) — department/semester added, both optional so
// student-role requests (which never send them) are unaffected.
const listResourcesQuerySchema = Joi.object({
  subjectId: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  department: Joi.string().trim().max(100).optional(),
  semester: Joi.number().integer().min(1).max(8).optional(),
  type: Joi.string().valid(...RESOURCE_TYPE_VALUES).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateUploadResource = (req, res, next) => {
  const { error, value } = uploadResourceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateVerifyResource = (req, res, next) => {
  const { error, value } = verifyResourceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateResourceIdParam = (req, res, next) => {
  const { error } = resourceIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateListResourcesQuery = (req, res, next) => {
  const { error, value } = listResourcesQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateUploadResource,
  validateVerifyResource,
  validateResourceIdParam,
  validateListResourcesQuery
};