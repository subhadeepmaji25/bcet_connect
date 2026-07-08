// backend/src/modules/users/validators/experience.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const EMPLOYMENT_TYPES = ["internship","full-time","part-time","freelance","contract","research","volunteer","other"];

const proofSchema = Joi.object({
  title: Joi.string().trim().max(150).allow("").optional(),
  url: Joi.string().uri().allow("").optional(),
  type: Joi.string().trim().max(50).allow("").optional()
});

const createExperienceSchema = Joi.object({
  company: Joi.string().trim().min(2).max(200).required(),
  companyDomain: Joi.string().trim().max(150).allow("").optional(),
  position: Joi.string().trim().min(2).max(150).required(),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES).optional(),
  industry: Joi.string().trim().max(150).allow("").optional(),
  description: Joi.string().max(3000).allow("").optional(),
  achievements: Joi.array().items(Joi.string().trim().max(300)).optional(),
  skillsUsed: Joi.array().items(Joi.string().trim().lowercase().max(100)).optional(),
  location: Joi.string().trim().max(150).allow("").optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
  currentlyWorking: Joi.boolean().optional(),
  proofs: Joi.array().items(proofSchema).optional()
}).custom((value, helpers) => {
  const { startDate, endDate, currentlyWorking } = value;
  if (currentlyWorking && endDate) {
    return helpers.message("Cannot provide endDate when currentlyWorking is true");
  }
  if (endDate && new Date(endDate) < new Date(startDate)) {
    return helpers.message("End date cannot be before start date");
  }
  return value;
});

const updateExperienceSchema = Joi.object({
  company: Joi.string().trim().min(2).max(200),
  companyDomain: Joi.string().trim().max(150).allow(""),
  position: Joi.string().trim().min(2).max(150),
  employmentType: Joi.string().valid(...EMPLOYMENT_TYPES),
  industry: Joi.string().trim().max(150).allow(""),
  description: Joi.string().max(3000).allow(""),
  achievements: Joi.array().items(Joi.string().trim().max(300)),
  skillsUsed: Joi.array().items(Joi.string().trim().lowercase().max(100)),
  location: Joi.string().trim().max(150).allow(""),
  startDate: Joi.date(),
  endDate: Joi.date(),
  currentlyWorking: Joi.boolean(),
  proofs: Joi.array().items(proofSchema)
}).min(1).custom((value, helpers) => {
  if (value.currentlyWorking === true && value.endDate) {
    return helpers.message("Cannot provide endDate when currentlyWorking is true");
  }
  if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
    return helpers.message("End date cannot be before start date");
  }
  return value;
});

const validateCreateExperience = (req, res, next) => {
  const { error, value } = createExperienceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateUpdateExperience = (req, res, next) => {
  const { error, value } = updateExperienceSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = { createExperienceSchema, updateExperienceSchema, validateCreateExperience, validateUpdateExperience };