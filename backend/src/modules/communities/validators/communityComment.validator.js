// backend/src/modules/communities/validators/communityComment.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { LIMITS } = require("../constants/community.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const createCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(LIMITS.COMMENT_MAX).required(),
  parentCommentId: Joi.string().pattern(OBJECT_ID_PATTERN).optional()
    .messages({ "string.pattern.base": "parentCommentId must be a valid id" })
});

const editCommentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(LIMITS.COMMENT_MAX).required()
});

const commentIdParamSchema = Joi.object({
  commentId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "commentId must be a valid id" })
});

const postIdParamSchema = Joi.object({
  postId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "postId must be a valid id" })
});

const commentsQuerySchema = Joi.object({
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateCreateComment = (req, res, next) => {
  const { error, value } = createCommentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateEditComment = (req, res, next) => {
  const { error, value } = editCommentSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCommentIdParam = (req, res, next) => {
  const { error } = commentIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validatePostIdParam = (req, res, next) => {
  const { error } = postIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateCommentsQuery = (req, res, next) => {
  const { error, value } = commentsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateCreateComment,
  validateEditComment,
  validateCommentIdParam,
  validatePostIdParam,
  validateCommentsQuery
};