// backend/src/modules/communication/validators/conversation.validator.js
//
// Structural gatekeeper only. Never checks canCommunicate() — that
// permission check happens in conversation.service.js, which is the
// only place allowed to know about Mentorship/Connections.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const startConversationSchema = Joi.object({
  recipientId: Joi.string().pattern(OBJECT_ID_PATTERN).required().messages({
    "string.pattern.base": "recipientId must be a valid id"
  })
});

const noBodySchema = Joi.object({}).unknown(false);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateStartConversation: validate(startConversationSchema),
  validateArchiveConversation: validate(noBodySchema),
  validateUnarchiveConversation: validate(noBodySchema)
};