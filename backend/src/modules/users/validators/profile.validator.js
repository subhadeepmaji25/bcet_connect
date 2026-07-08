// backend/src/modules/users/validators/profile.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

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
  isMentor: Joi.boolean().optional()
}).min(1);

const validateUpdateProfile = (req, res, next) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = { updateProfileSchema, validateUpdateProfile };