// backend/src/modules/users/validators/education.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const EDUCATION_LEVELS = ["diploma", "bachelor", "master", "phd", "other"];
const GRADE_TYPES = ["cgpa", "percentage", "grade"];
const CURRENT_YEAR = new Date().getFullYear();

const createEducationSchema = Joi.object({
  institution: Joi.string().trim().min(2).max(200).required(),
  degree: Joi.string().trim().min(2).max(150).required(),
  branch: Joi.string().trim().min(2).max(150).required(),
  specialization: Joi.string().trim().max(150).allow("").optional(),
  educationLevel: Joi.string().valid(...EDUCATION_LEVELS).optional(),
  startYear: Joi.number().integer().min(1950).max(CURRENT_YEAR + 1).required(),
  endYear: Joi.number().integer().min(1950).max(CURRENT_YEAR + 10).optional(),
  current: Joi.boolean().optional(),
  gradeType: Joi.string().valid(...GRADE_TYPES).optional(),
  cgpa: Joi.number().min(0).max(10).optional(),
  achievements: Joi.array().items(Joi.string().trim().max(300)).optional(),
  skillsExtracted: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(50).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(80)).max(20).optional(),
  location: Joi.string().trim().max(150).allow("").optional()
}).custom((value, helpers) => {
  const { startYear, endYear, current } = value;
  if (!current && endYear && endYear < startYear) {
    return helpers.message("End year cannot be before start year");
  }
  if (current && endYear) {
    return helpers.message("Cannot provide endYear when currently studying");
  }
  return value;
});

const updateEducationSchema = Joi.object({
  institution: Joi.string().trim().min(2).max(200),
  degree: Joi.string().trim().min(2).max(150),
  branch: Joi.string().trim().min(2).max(150),
  specialization: Joi.string().trim().max(150).allow(""),
  educationLevel: Joi.string().valid(...EDUCATION_LEVELS),
  startYear: Joi.number().integer().min(1950).max(CURRENT_YEAR + 1),
  endYear: Joi.number().integer().min(1950).max(CURRENT_YEAR + 10),
  current: Joi.boolean(),
  gradeType: Joi.string().valid(...GRADE_TYPES),
  cgpa: Joi.number().min(0).max(10),
  achievements: Joi.array().items(Joi.string().trim().max(300)),
  skillsExtracted: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(50),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(80)).max(20),
  location: Joi.string().trim().max(150).allow("")
}).min(1).custom((value, helpers) => {
  if (value.current && value.endYear) {
    return helpers.message("Cannot provide endYear when currently studying");
  }
  if (value.startYear && value.endYear && value.endYear < value.startYear) {
    return helpers.message("End year cannot be before start year");
  }
  return value;
});

const validateCreateEducation = (req, res, next) => {
  const { error, value } = createEducationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateUpdateEducation = (req, res, next) => {
  const { error, value } = updateEducationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = { createEducationSchema, updateEducationSchema, validateCreateEducation, validateUpdateEducation };