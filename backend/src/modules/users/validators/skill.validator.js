// backend/src/modules/users/validators/skill.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const SKILL_LEVELS = ["beginner","intermediate","advanced","expert"];
const SKILL_SOURCES = ["manual","resume","project","certificate","experience","system"];

const BULK_ADD_MAX_SKILLS = 20;

const proofSchema = Joi.object({
  title: Joi.string().trim().max(150).allow("").optional(),
  url: Joi.string().uri().allow("").optional(),
  type: Joi.string().trim().max(50).allow("").optional()
});

const createSkillSchema = Joi.object({
  skillName: Joi.string().trim().min(1).max(100).required(),
  category: Joi.string().trim().max(100).allow("").optional(),
  level: Joi.string().valid(...SKILL_LEVELS).optional(),
  yearsOfExperience: Joi.number().min(0).max(50).optional(),
  source: Joi.string().valid(...SKILL_SOURCES).optional(),
  proofs: Joi.array().items(proofSchema).max(10).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(80)).max(20).optional()
});

const updateSkillSchema = Joi.object({
  skillName: Joi.string().trim().min(1).max(100),
  category: Joi.string().trim().max(100).allow(""),
  level: Joi.string().valid(...SKILL_LEVELS),
  yearsOfExperience: Joi.number().min(0).max(50),
  source: Joi.string().valid(...SKILL_SOURCES),
  proofs: Joi.array().items(proofSchema).max(10),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(80)).max(20)
}).min(1);

const bulkAddSkillsSchema = Joi.object({
  skillNames: Joi.array()
    .items(Joi.string().trim().min(1).max(100))
    .min(1)
    .max(BULK_ADD_MAX_SKILLS)
    .required(),
  source: Joi.string().valid(...SKILL_SOURCES).optional()
});

const validateCreateSkill = (req, res, next) => {
  const { error, value } = createSkillSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateUpdateSkill = (req, res, next) => {
  const { error, value } = updateSkillSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateBulkAddSkills = (req, res, next) => {
  const { error, value } = bulkAddSkillsSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = {
  createSkillSchema,
  updateSkillSchema,
  bulkAddSkillsSchema,
  validateCreateSkill,
  validateUpdateSkill,
  validateBulkAddSkills
};