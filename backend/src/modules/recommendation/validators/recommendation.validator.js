// backend/src/modules/recommendation/validators/recommendation.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const recommendationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
  minScore: Joi.number().integer().min(0).max(100).optional()
});

const validateRecommendationQuery = (req, res, next) => {
  const { error, value } = recommendationQuerySchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return next(
      ApiError.validation(
        "Invalid recommendation query parameters",
        error.details.map((detail) => detail.message)
      )
    );
  }

  req.query = value;
  next();
};

module.exports = {
  validateRecommendationQuery
};