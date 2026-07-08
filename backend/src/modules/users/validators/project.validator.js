// backend/src/modules/users/validators/project.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const PROJECT_TYPES = ["academic","personal","hackathon","freelance","research","open-source","other"];
const PROJECT_STATUS = ["planned","in-progress","completed"];
const PROJECT_VISIBILITY = ["public","private"];

const mediaSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().trim().max(255).allow("").optional()
});

const createProjectSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().min(10).max(5000).required(),
  projectType: Joi.string().valid(...PROJECT_TYPES).optional(),
  status: Joi.string().valid(...PROJECT_STATUS).optional(),
  visibility: Joi.string().valid(...PROJECT_VISIBILITY).optional(),
  techStack: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(50).optional(),
  skillsExtracted: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(100).optional(),
  collaborators: Joi.array().items(Joi.string().hex().length(24)).optional(),
  achievements: Joi.array().items(Joi.string().trim().max(300)).optional(),
  githubUrl: Joi.string().uri().allow("").optional(),
  demoUrl: Joi.string().uri().allow("").optional(),
  thumbnail: Joi.string().uri().allow("").optional(),
  thumbnailPublicId: Joi.string().trim().max(255).allow("").optional(),
  gallery: Joi.array().items(mediaSchema).max(20).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  teamSize: Joi.number().integer().min(1).max(100).optional(),
  featured: Joi.boolean().optional(),
  deployed: Joi.boolean().optional()
}).custom((value, helpers) => {
  const { startDate, endDate, status } = value;
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return helpers.message("End date cannot be before start date");
  }
  if (status === "completed" && startDate && !endDate) {
    return helpers.message("Completed projects should have an endDate");
  }
  return value;
});

const updateProjectSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200),
  description: Joi.string().trim().min(10).max(5000),
  projectType: Joi.string().valid(...PROJECT_TYPES),
  status: Joi.string().valid(...PROJECT_STATUS),
  visibility: Joi.string().valid(...PROJECT_VISIBILITY),
  techStack: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(50),
  skillsExtracted: Joi.array().items(Joi.string().trim().lowercase().max(100)).max(100),
  collaborators: Joi.array().items(Joi.string().hex().length(24)),
  achievements: Joi.array().items(Joi.string().trim().max(300)),
  githubUrl: Joi.string().uri().allow(""),
  demoUrl: Joi.string().uri().allow(""),
  thumbnail: Joi.string().uri().allow(""),
  thumbnailPublicId: Joi.string().trim().max(255).allow(""),
  gallery: Joi.array().items(mediaSchema).max(20),
  startDate: Joi.date(),
  endDate: Joi.date(),
  teamSize: Joi.number().integer().min(1).max(100),
  featured: Joi.boolean(),
  deployed: Joi.boolean()
}).min(1).custom((value, helpers) => {
  if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
    return helpers.message("End date cannot be before start date");
  }
  return value;
});

const validateCreateProject = (req, res, next) => {
  const { error, value } = createProjectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

const validateUpdateProject = (req, res, next) => {
  const { error, value } = updateProjectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map(d => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = { createProjectSchema, updateProjectSchema, validateCreateProject, validateUpdateProject };