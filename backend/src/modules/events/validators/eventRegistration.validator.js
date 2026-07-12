// backend/src/modules/events/validators/eventRegistration.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { REGISTRATION_STATUS_VALUES } = require("../constants/event.constants");

const listRegistrationsQuerySchema = Joi.object({
  status: Joi.string().valid(...REGISTRATION_STATUS_VALUES).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const validateListRegistrationsQuery = (req, res, next) => {
  const { error, value } = listRegistrationsQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = { validateListRegistrationsQuery };
