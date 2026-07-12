// backend/src/modules/learning/validators/subject.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { SEMESTER_MIN, SEMESTER_MAX, CREDITS_MIN, CREDITS_MAX } = require("../constants/subject.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const createSubjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  code: Joi.string().trim().uppercase().min(2).max(20).required(),
  department: Joi.string().trim().min(2).max(100).required(),
  semester: Joi.number().integer().min(SEMESTER_MIN).max(SEMESTER_MAX).required(),
  credits: Joi.number().integer().min(CREDITS_MIN).max(CREDITS_MAX).optional(),
  description: Joi.string().trim().max(1000).allow("").optional()
});

const updateSubjectSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  credits: Joi.number().integer().min(CREDITS_MIN).max(CREDITS_MAX),
  description: Joi.string().trim().max(1000).allow("")
}).min(1);

const subjectIdParamSchema = Joi.object({
  subjectId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "subjectId must be a valid id" })
});

const listSubjectsQuerySchema = Joi.object({
  department: Joi.string().trim().max(100).optional(),
  semester: Joi.number().integer().min(SEMESTER_MIN).max(SEMESTER_MAX).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateCreateSubject = (req, res, next) => {
  const { error, value } = createSubjectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateUpdateSubject = (req, res, next) => {
  const { error, value } = updateSubjectSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateSubjectIdParam = (req, res, next) => {
  const { error } = subjectIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateListSubjectsQuery = (req, res, next) => {
  const { error, value } = listSubjectsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateCreateSubject,
  validateUpdateSubject,
  validateSubjectIdParam,
  validateListSubjectsQuery
};