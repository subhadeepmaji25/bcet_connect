// backend/src/modules/events/validators/eventFeedback.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { FEEDBACK_RATING_MIN, FEEDBACK_RATING_MAX } = require("../constants/event.constants");

// Mirrors createEventSchema/updateEventSchema's exact shape+bounds
// discipline — rating bounds pulled from the same named constants the
// EventFeedback model itself uses (see model comment), so validator and
// schema can never silently drift apart.
const submitFeedbackSchema = Joi.object({
  rating: Joi.number().integer().min(FEEDBACK_RATING_MIN).max(FEEDBACK_RATING_MAX).required(),
  review: Joi.string().trim().max(500).allow("").optional()
});

const listFeedbackQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req[source] = value;
  next();
};

module.exports = {
  validateSubmitFeedback: validate(submitFeedbackSchema),
  validateListFeedbackQuery: validate(listFeedbackQuerySchema, "query")
};