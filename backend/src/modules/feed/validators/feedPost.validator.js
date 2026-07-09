// backend/src/modules/feed/validators/feedPost.validator.js
//
// PHASE 3 UPDATE: added validateReactionType for the new /react route
// (feedReaction.controller.js). Everything else below is UNCHANGED —
// createPost/editPost/postIdParam/feedQuery validation stays exactly
// as it was.
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const {
  POST_TYPE_VALUES, VISIBILITY_VALUES, LIMITS,
  REACTION_TYPE_VALUES // NEW
} = require("../constants/feed.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Mirrors what attachment.service.js returns from Cloudinary (same
// upload endpoints as Communication/Communities — reused as-is).
// mimeType/size required, matching communityPost.validator.js's
// Phase-5 consistency fix — a genuine upload response always has them.
const attachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
  type: Joi.string().valid("image", "video", "voice_note", "document").required(),
  mimeType: Joi.string().required(),
  size: Joi.number().positive().required(),
  originalName: Joi.string().trim().max(255).allow("").optional(),
  duration: Joi.number().integer().positive().optional()
});

const createPostSchema = Joi.object({
  type: Joi.string().valid(...POST_TYPE_VALUES).optional(),
  content: Joi.string().trim().max(LIMITS.POST_CONTENT_MAX).allow("").optional(),
  attachments: Joi.array().items(attachmentSchema).max(LIMITS.ATTACHMENTS_MAX_PER_POST).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(LIMITS.TAGS_MAX_PER_POST).optional(),
  mentions: Joi.array().items(Joi.string().pattern(OBJECT_ID_PATTERN)).max(LIMITS.MENTIONS_MAX_PER_POST).optional(),
  visibility: Joi.string().valid(...VISIBILITY_VALUES).optional()
}).custom((value, helpers) => {
  if (!value.content && (!value.attachments || value.attachments.length === 0)) {
    return helpers.message("Post must have content or at least one attachment — if you attached a file, check that the upload step completed and the attachment metadata was included in this request");
  }
  return value;
}, "post-shape-rules");

const editPostSchema = Joi.object({
  content: Joi.string().trim().max(LIMITS.POST_CONTENT_MAX).allow(""),
  attachments: Joi.array().items(attachmentSchema).max(LIMITS.ATTACHMENTS_MAX_PER_POST),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(LIMITS.TAGS_MAX_PER_POST)
}).min(1);

const postIdParamSchema = Joi.object({
  postId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "postId must be a valid id" })
});

const feedQuerySchema = Joi.object({
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(30).optional()
});

// NEW — validates the body of POST /posts/:postId/react. postId itself
// is validated separately by validatePostIdParam on the same route,
// same two-schemas-per-route pattern already used for comments.
const reactionTypeSchema = Joi.object({
  type: Joi.string().valid(...REACTION_TYPE_VALUES).required()
});

const pinPostSchema = Joi.object({
  pinned: Joi.boolean().default(true)
});

const moderatePostSchema = Joi.object({
  action: Joi.string().valid("hide", "restore").required(),
  note: Joi.string().trim().max(LIMITS.REPORT_NOTE_MAX).allow("").optional()
});

const validateCreatePost = (req, res, next) => {
  const { error, value } = createPostSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateEditPost = (req, res, next) => {
  const { error, value } = editPostSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validatePostIdParam = (req, res, next) => {
  const { error } = postIdParamSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateFeedQuery = (req, res, next) => {
  const { error, value } = feedQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

// NEW
const validateReactionType = (req, res, next) => {
  const { error, value } = reactionTypeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validatePinPost = (req, res, next) => {
  const { error, value } = pinPostSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateModeratePost = (req, res, next) => {
  const { error, value } = moderatePostSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateCreatePost, validateEditPost, validatePostIdParam, validateFeedQuery,
  validateReactionType,
  validatePinPost,
  validateModeratePost
};
