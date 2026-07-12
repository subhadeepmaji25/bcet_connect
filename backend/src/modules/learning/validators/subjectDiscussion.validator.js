// backend/src/modules/learning/validators/subjectDiscussion.validator.js
//
// FIX: previous version used
//   .when(Joi.object({ parentDiscussionId: Joi.valid(null, undefined) }).unknown(), {...})
// which crashed at require-time — Joi.valid()/allow() cannot be called
// with `undefined` as an argument (Hapi's assert throws immediately,
// before any request even comes in — that's why the crash happened on
// server boot, not on a request).
//
// FIXED approach: use a field-level `.when()` on `title` itself,
// referencing the sibling `parentDiscussionId` field directly (Joi's
// normal, supported pattern for "field A's rules depend on field B").
// `is: Joi.string().pattern(OBJECT_ID_PATTERN).required()` checks
// "does parentDiscussionId hold a valid ObjectId string" — true only
// for an answer (parentDiscussionId present + valid). Any other case
// (null, missing, or invalid) falls through to `otherwise`, which is
// exactly the "top-level question" case where title is mandatory.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const subjectIdParamSchema = Joi.object({
  subjectId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

const discussionIdParamSchema = Joi.object({
  discussionId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
});

const createDiscussionSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required(),
  parentDiscussionId: Joi.string().pattern(OBJECT_ID_PATTERN).allow(null).optional(),
  title: Joi.string().trim().max(200).allow("").optional().when("parentDiscussionId", {
    is: Joi.string().pattern(OBJECT_ID_PATTERN).required(),
    then: Joi.string().trim().max(200).allow("").optional(),      // answer — title unused
    otherwise: Joi.string().trim().min(1).max(200).required()     // top-level question — title required
  })
});

const editDiscussionSchema = Joi.object({
  content: Joi.string().trim().min(1).max(2000).required()
});

const cursorQuerySchema = Joi.object({
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateSubjectIdParam = (req, res, next) => {
  const { error } = subjectIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateDiscussionIdParam = (req, res, next) => {
  const { error } = discussionIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateCreateDiscussion = (req, res, next) => {
  const { error, value } = createDiscussionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateEditDiscussion = (req, res, next) => {
  const { error, value } = editDiscussionSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateCursorQuery = (req, res, next) => {
  const { error, value } = cursorQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateSubjectIdParam,
  validateDiscussionIdParam,
  validateCreateDiscussion,
  validateEditDiscussion,
  validateCursorQuery
};