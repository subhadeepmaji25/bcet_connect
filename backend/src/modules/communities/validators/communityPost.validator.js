// backend/src/modules/communities/validators/communityPost.validator.js
//
// FIXED:
// 1. The single shared .custom() rule used helpers.error("any.custom", {message})
//    without an overriding .messages() entry — Joi falls back to its default
//    template ('"value" failed custom validation because ...'), which is
//    the exact opaque text you were seeing on attachment failures. Rewritten
//    with helpers.message(...) per condition, so the real reason is visible.
// 2. Phase 5 consistency: attachmentSchema now requires mimeType and size
//    (previously optional here, required in message.validator.js). Since
//    attachment.service.js always returns full metadata for both chat and
//    feed uploads, there is no real case where a valid upload response is
//    missing these — making them optional only hid bad/incomplete client
//    calls instead of catching them. originalName/duration remain optional
//    since not every attachment type has them (an image has no duration).

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { POST_TYPES_VALUES, LIMITS } = require("../constants/community.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Mirrors the shape attachment.service.js returns from Cloudinary (same
// upload endpoints as Communication chat attachments — reused as-is per
// project convention). mimeType/size are now required to match
// message.validator.js (Phase 5 consistency) — a genuine upload response
// always includes them, so requiring them here catches broken client
// calls instead of silently stripping the metadata.
const attachmentSchema = Joi.object({
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
  type: Joi.string().valid("image", "video", "voice_note", "document").required(),
  mimeType: Joi.string().required(),
  size: Joi.number().positive().required(),
  originalName: Joi.string().trim().max(255).allow("").optional(),
  duration: Joi.number().integer().positive().optional()
});

// "poll" excluded here — reserved in constants for a future phase,
// service layer doesn't implement poll logic yet, so it's not
// accepted as a creatable postType until that lands.
const CREATABLE_POST_TYPES = POST_TYPES_VALUES.filter((t) => t !== "poll");

const createPostSchema = Joi.object({
  content: Joi.string().trim().max(LIMITS.POST_CONTENT_MAX).allow("").optional(),
  attachments: Joi.array().items(attachmentSchema).max(LIMITS.ATTACHMENTS_MAX_PER_POST).optional(),
  mentions: Joi.array().items(Joi.string().pattern(OBJECT_ID_PATTERN)).max(LIMITS.MENTIONS_MAX_PER_POST).optional(),
  postType: Joi.string().valid(...CREATABLE_POST_TYPES).optional()
}).custom((value, helpers) => {
  // A post must have content OR at least one attachment — an empty
  // post with no attachments is not a valid feed entry. FIX: uses
  // helpers.message() with an explicit string, bypassing Joi's opaque
  // '"value" failed custom validation because ...' default template.
  if (!value.content && (!value.attachments || value.attachments.length === 0)) {
    return helpers.message("Post must have content or at least one attachment — if you attached a file, check that the upload step completed and the attachment metadata was included in this request");
  }
  return value;
}, "post-shape-rules");

const editPostSchema = Joi.object({
  content: Joi.string().trim().max(LIMITS.POST_CONTENT_MAX).allow(""),
  attachments: Joi.array().items(attachmentSchema).max(LIMITS.ATTACHMENTS_MAX_PER_POST)
}).min(1);

const pinPostSchema = Joi.object({
  pinned: Joi.boolean().required()
});

const postIdParamSchema = Joi.object({
  postId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "postId must be a valid id" })
});

const feedQuerySchema = Joi.object({
  cursor: Joi.string().pattern(OBJECT_ID_PATTERN).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
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

const validatePinPost = (req, res, next) => {
  const { error, value } = pinPostSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
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

module.exports = {
  validateCreatePost,
  validateEditPost,
  validatePinPost,
  validatePostIdParam,
  validateFeedQuery
};