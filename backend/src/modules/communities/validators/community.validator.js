// backend/src/modules/communities/validators/community.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { CATEGORIES, VISIBILITY_VALUES, LIMITS } = require("../constants/community.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const settingsSchema = Joi.object({
  allowMedia: Joi.boolean(),
  allowLinks: Joi.boolean(),
  allowFiles: Joi.boolean(),
  allowVoice: Joi.boolean(),
  allowExternalMembers: Joi.boolean(),
  allowMentorPosts: Joi.boolean(),
  requireApproval: Joi.boolean()
});

const createCommunitySchema = Joi.object({
  name: Joi.string().trim().min(LIMITS.NAME_MIN).max(LIMITS.NAME_MAX).required(),
  description: Joi.string().trim().max(LIMITS.DESCRIPTION_MAX).allow("").optional(),
  rules: Joi.array().items(Joi.string().trim().max(LIMITS.RULE_MAX_LENGTH)).max(LIMITS.RULES_MAX_ITEMS).optional(),
  category: Joi.string().valid(...CATEGORIES).required(),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(LIMITS.TAGS_MAX).optional(),
  visibility: Joi.string().valid(...VISIBILITY_VALUES).optional(),
  coverImage: Joi.string().uri().allow("").optional(),
  coverImagePublicId: Joi.string().allow("").optional(),
  avatar: Joi.string().uri().allow("").optional(),
  avatarPublicId: Joi.string().allow("").optional(),
  settings: settingsSchema.optional()
});

const updateCommunitySchema = Joi.object({
  description: Joi.string().trim().max(LIMITS.DESCRIPTION_MAX).allow(""),
  rules: Joi.array().items(Joi.string().trim().max(LIMITS.RULE_MAX_LENGTH)).max(LIMITS.RULES_MAX_ITEMS),
  tags: Joi.array().items(Joi.string().trim().lowercase()).max(LIMITS.TAGS_MAX),
  // FIX: was missing — this is why public/private could never be changed
  // after creation. Service-layer permission check (edit_community)
  // still decides WHO can actually flip it.
  visibility: Joi.string().valid(...VISIBILITY_VALUES),
  coverImage: Joi.string().uri().allow(""),
  coverImagePublicId: Joi.string().allow(""),
  avatar: Joi.string().uri().allow(""),
  avatarPublicId: Joi.string().allow(""),
  settings: settingsSchema
}).min(1);

const communityIdParamSchema = Joi.object({
  communityId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "communityId must be a valid id" })
});

const listCommunitiesQuerySchema = Joi.object({
  category: Joi.string().valid(...CATEGORIES).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

// Phase 3: search query validation
const searchCommunitiesQuerySchema = Joi.object({
  keyword: Joi.string().trim().min(1).max(100).optional(),
  category: Joi.string().valid(...CATEGORIES).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase()).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateCreateCommunity = (req, res, next) => {
  const { error, value } = createCommunitySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateUpdateCommunity = (req, res, next) => {
  const { error, value } = updateCommunitySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCommunityIdParam = (req, res, next) => {
  const { error } = communityIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateListCommunitiesQuery = (req, res, next) => {
  const { error, value } = listCommunitiesQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

const validateSearchCommunitiesQuery = (req, res, next) => {
  const { error, value } = searchCommunitiesQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateCreateCommunity,
  validateUpdateCommunity,
  validateCommunityIdParam,
  validateListCommunitiesQuery,
  validateSearchCommunitiesQuery
};