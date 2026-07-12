// backend/src/modules/learning/validators/learningPath.validator.js
//
// NEW MODULE — Learning (Career Learning domain, Phase 5).
// Same Joi + stripUnknown pattern as resource.validator.js/subject.validator.js.
//
// UPDATED (Phase 4 — Career Learning Path progress): added
// pathStepIdParamSchema/validateStepIdParam and
// updateStepProgressSchema/validateUpdateStepProgress for the new
// enroll/step-progress routes — same OBJECT_ID_PATTERN this file
// already uses for pathIdParamSchema, just extended with a second
// :stepId segment.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { JOB_CATEGORIES } = require("../../jobs/models/Job");
const { DIFFICULTY_VALUES } = require("../constants/resource.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const pathIdParamSchema = Joi.object({
  pathId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "pathId must be a valid id" })
});

// NEW (Phase 4) — pathId + stepId together, for
// PATCH /paths/:pathId/steps/:stepId/progress.
const pathStepIdParamSchema = Joi.object({
  pathId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "pathId must be a valid id" }),
  stepId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "stepId must be a valid id" })
});

// Each step must reference EXACTLY ONE of resourceId / externalUrl —
// same xor discipline resource.validator.js already uses for file vs
// externalUrl on LearningResource itself.
const stepSchema = Joi.object({
  order: Joi.number().integer().min(1).required(),
  title: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(500).allow("").optional(),
  resourceId: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  externalUrl: Joi.string().uri().optional(),
  skillTags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  estimatedTimeMinutes: Joi.number().min(0).optional()
}).xor("resourceId", "externalUrl");

const createPathSchema = Joi.object({
  title: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
  careerTrack: Joi.string().valid(...JOB_CATEGORIES).required(),
  level: Joi.string().valid(...DIFFICULTY_VALUES).optional(),
  skills: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  prerequisites: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  outcomeSkills: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  steps: Joi.array().items(stepSchema).max(30).optional()
});

const updatePathSchema = createPathSchema.fork(
  ["title", "careerTrack"],
  (schema) => schema.optional()
).min(1);

const listPathsQuerySchema = Joi.object({
  careerTrack: Joi.string().valid(...JOB_CATEGORIES).optional(),
  skill: Joi.string().trim().lowercase().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

// NEW (Phase 4) — body for PATCH /paths/:pathId/steps/:stepId/progress.
// `completed` is required (not optional/toggle-only) so the client is
// always explicit about direction — same reasoning
// resourceEngagement.validator.js's rating/comment bodies never leave
// the caller's intent ambiguous.
const updateStepProgressSchema = Joi.object({
  completed: Joi.boolean().required()
});

const validatePathIdParam = (req, res, next) => {
  const { error } = pathIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

// NEW (Phase 4)
const validateStepIdParam = (req, res, next) => {
  const { error } = pathStepIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateCreatePath = (req, res, next) => {
  const { error, value } = createPathSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateUpdatePath = (req, res, next) => {
  const { error, value } = updatePathSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateListPathsQuery = (req, res, next) => {
  const { error, value } = listPathsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

// NEW (Phase 4)
const validateUpdateStepProgress = (req, res, next) => {
  const { error, value } = updateStepProgressSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validatePathIdParam,
  validateCreatePath,
  validateUpdatePath,
  validateListPathsQuery,
  validateStepIdParam, // NEW (Phase 4)
  validateUpdateStepProgress // NEW (Phase 4)
};