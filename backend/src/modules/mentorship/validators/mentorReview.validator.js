// backend/src/modules/mentorship/validators/mentorReview.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { RATING, LIMITS } = require("../constants/mentor.constants");

const createReviewSchema = Joi.object({
  rating: Joi.number().min(RATING.MIN).max(RATING.MAX).required(),
  feedback: Joi.string().trim().max(LIMITS.REVIEW_FEEDBACK_MAX).allow("").optional(),
  anonymous: Joi.boolean().optional()
});

const validateCreateReview = (req, res, next) => {
  const { error, value } = createReviewSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = { validateCreateReview };