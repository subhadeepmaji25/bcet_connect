// backend/src/modules/users/validators/profile.validator.js
//
// UPDATED (Learning module foundation): Added `semester` and `section`
// to updateProfileSchema so students/faculty can set them via the
// existing PATCH /users/profile route.
//
// `isCR` is deliberately NOT added here. It is a Faculty-granted status,
// not a self-editable field — if it were added to this schema, any
// student could PATCH their own profile with `{ "isCR": true }` and grant
// themselves upload permissions. It has its own dedicated schema below
// (setCRStatusSchema) on a separate Faculty/Admin-only endpoint.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const socialLinksSchema = Joi.object({
  github: Joi.string().uri().allow("").optional(),
  linkedin: Joi.string().uri().allow("").optional(),
  portfolio: Joi.string().uri().allow("").optional(),
  website: Joi.string().uri().allow("").optional()
});

const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).optional(),
  headline: Joi.string().trim().max(120).allow("").optional(),
  bio: Joi.string().max(1000).allow("").optional(),
  avatar: Joi.string().uri().allow("").optional(),
  avatarPublicId: Joi.string().trim().max(255).allow("").optional(),
  coverImage: Joi.string().uri().allow("").optional(),
  coverImagePublicId: Joi.string().trim().max(255).allow("").optional(),
  branch: Joi.string().trim().max(100).allow("").optional(),
  department: Joi.string().trim().max(100).allow("").optional(),
  currentYear: Joi.number().integer().min(1).max(4).optional(),
  passoutYear: Joi.number().integer().min(1990).max(2040).optional(),
  currentCompany: Joi.string().trim().max(150).allow("").optional(),
  currentRole: Joi.string().trim().max(150).allow("").optional(),
  location: Joi.string().trim().max(150).allow("").optional(),
  interests: Joi.array().items(Joi.string().trim().lowercase().max(80)).max(30).optional(),
  searchableSkills: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(50).optional(),
  socialLinks: socialLinksSchema.optional(),
  visibility: Joi.string().valid("public", "private").optional(),
  isMentor: Joi.boolean().optional(),

  // ── Learning module foundation ──
  semester: Joi.number().integer().min(1).max(8).optional(),
  section: Joi.string().trim().uppercase().max(5).allow("").optional()
}).min(1);

// ── NEW (Phase 1a — CR-grant endpoint) ──────────────────────────────
// Separate schema, separate route, separate controller — never merged
// into updateProfileSchema above. targetUserId comes from the URL
// param (validated by setCRStatusParamSchema), not the body, so there
// is no way to smuggle isCR through the self-service profile route.
const setCRStatusParamSchema = Joi.object({
  userId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "userId must be a valid id" })
});

const setCRStatusSchema = Joi.object({
  isCR: Joi.boolean().required()
});

const validateUpdateProfile = (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateSetCRStatusParam = (req, res, next) => {
  const { error } = setCRStatusParamSchema.validate(req.params, { abortEarly: false });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  next();
};

const validateSetCRStatus = (req, res, next) => {
  const { error, value } = setCRStatusSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = {
  updateProfileSchema,
  validateUpdateProfile,
  setCRStatusSchema,
  validateSetCRStatusParam,
  validateSetCRStatus
};