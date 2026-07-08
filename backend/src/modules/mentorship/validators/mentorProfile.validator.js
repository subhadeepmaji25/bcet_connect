// backend/src/modules/mentorship/validators/mentorProfile.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const {
  EXPERTISE_DOMAINS,
  SUPPORTED_LANGUAGES,
  AVAILABILITY_DAYS,
  SESSION_DURATIONS,
  PROFILE_VISIBILITY_VALUES, // NEW — from constants (added earlier: profileVisibility field)
  LIMITS
} = require("../constants/mentor.constants");

const availabilitySlotSchema = Joi.object({
  day: Joi.string().valid(...AVAILABILITY_DAYS).required(),
  startTime: Joi.string().trim().max(10).required(),
  endTime: Joi.string().trim().max(10).required(),
  slotDuration: Joi.number().valid(...SESSION_DURATIONS).optional()
});

const becomeMentorSchema = Joi.object({
  bio: Joi.string().trim().min(LIMITS.BIO_MIN).max(LIMITS.BIO_MAX).allow("").optional(),
  domains: Joi.array().items(Joi.string().valid(...EXPERTISE_DOMAINS)).min(1).max(LIMITS.MAX_DOMAINS).required(),
  languages: Joi.array().items(Joi.string().valid(...SUPPORTED_LANGUAGES)).max(LIMITS.MAX_LANGUAGES).optional(),
  yearsExperience: Joi.number().min(LIMITS.YEARS_EXPERIENCE_MIN).max(LIMITS.YEARS_EXPERIENCE_MAX).optional(),
  company: Joi.string().trim().max(150).allow("").optional(),
  designation: Joi.string().trim().max(150).allow("").optional(),
  availability: Joi.array().items(availabilitySlotSchema).max(20).optional()
  // NOTE: profileVisibility yahan intentionally nahi hai — becomeMentor ke time
  // model default ("public") apne aap lagega. Visibility sirf dedicated endpoint
  // se change hoti hai (validateUpdateVisibility), taaki accidental body-injection
  // se privacy silently na badal jaye.
});

const updateMentorProfileSchema = Joi.object({
  bio: Joi.string().trim().min(LIMITS.BIO_MIN).max(LIMITS.BIO_MAX).allow(""),
  domains: Joi.array().items(Joi.string().valid(...EXPERTISE_DOMAINS)).min(1).max(LIMITS.MAX_DOMAINS),
  languages: Joi.array().items(Joi.string().valid(...SUPPORTED_LANGUAGES)).max(LIMITS.MAX_LANGUAGES),
  yearsExperience: Joi.number().min(LIMITS.YEARS_EXPERIENCE_MIN).max(LIMITS.YEARS_EXPERIENCE_MAX),
  company: Joi.string().trim().max(150).allow(""),
  designation: Joi.string().trim().max(150).allow(""),
  availability: Joi.array().items(availabilitySlotSchema).max(20)
}).min(1);

// NEW — dedicated schema for the mentorship-specific public/private toggle.
// Kept separate from updateMentorProfileSchema on purpose (see note above).
const updateVisibilitySchema = Joi.object({
  visibility: Joi.string().valid(...PROFILE_VISIBILITY_VALUES).required()
});

const validateBecomeMentor = (req, res, next) => {
  const { error, value } = becomeMentorSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateUpdateMentorProfile = (req, res, next) => {
  const { error, value } = updateMentorProfileSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

// NEW
const validateUpdateVisibility = (req, res, next) => {
  const { error, value } = updateVisibilitySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateBecomeMentor,
  validateUpdateMentorProfile,
  validateUpdateVisibility // NEW — wire this into mentorship.routes.js on PATCH /profile/visibility
};