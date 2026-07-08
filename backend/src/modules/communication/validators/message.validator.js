// backend/src/modules/communication/validators/message.validator.js
//
// FIXED: the shared .custom() rule used helpers.error("any.custom", {message})
// without an overriding .messages() entry, so Joi fell back to its default
// template — the exact '"value" failed custom validation because ...' text
// you saw on failed attachment sends in group chat. Rewritten with
// helpers.message() per condition below, so the actual reason (empty
// message vs. mixed heavy-media) is now visible in the error response
// instead of a generic label.
//
// NOTE (Phase 5 consistency): this is the stricter attachment shape
// (mimeType/size required) since attachment.service.js always returns
// full Cloudinary metadata. communityPost.validator.js's attachmentSchema
// has been aligned to require the same fields, so a client can build one
// shared "attachment" type instead of two slightly different ones.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const {
  LIMITS,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_VALUES
} = require("../constants/communication.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const attachmentSchema = Joi.object({
  type: Joi.string().valid(...ATTACHMENT_TYPE_VALUES).required(),
  url: Joi.string().uri().required(),
  publicId: Joi.string().required(),
  mimeType: Joi.string().required(),
  size: Joi.number().positive().required(),
  originalName: Joi.string().trim().max(255).allow("").optional(),
  duration: Joi.number().integer().positive().max(LIMITS.MAX_ATTACHMENT_DURATION_SECONDS).optional()
});

const sendMessageSchema = Joi.object({
  text: Joi.string().trim().max(LIMITS.MESSAGE_TEXT_MAX).allow("").optional(),
  attachments: Joi.array().items(attachmentSchema).max(LIMITS.MAX_ATTACHMENTS_PER_MESSAGE).optional(),
  replyTo: Joi.string().pattern(OBJECT_ID_PATTERN).optional()
}).custom((value, helpers) => {
  // FIX: helpers.message(...) gives a direct, specific error string
  // instead of routing through Joi's generic any.custom template.
  if (!value.text && (!value.attachments || value.attachments.length === 0)) {
    return helpers.message("Message must have text or at least one attachment — if you attached a file, check that the upload step completed and the attachment metadata was included in this request");
  }

  const hasHeavyMedia = (value.attachments || []).some(
    (a) => a.type === ATTACHMENT_TYPES.VOICE_NOTE || a.type === ATTACHMENT_TYPES.VIDEO
  );
  if (hasHeavyMedia && value.attachments.length > 1) {
    return helpers.message("A voice note or video must be sent as the only attachment in a message — remove the other attachments or send them separately");
  }

  return value;
}, "message-shape-rules");

const editMessageSchema = Joi.object({
  text: Joi.string().trim().min(1).max(LIMITS.MESSAGE_TEXT_MAX).required()
});

const noBodySchema = Joi.object({}).unknown(false);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateSendMessage: validate(sendMessageSchema),
  validateEditMessage: validate(editMessageSchema),
  validateDeleteMessage: validate(noBodySchema),
  validateMarkAsRead: validate(noBodySchema)
};