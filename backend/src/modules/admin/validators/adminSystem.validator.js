// backend/src/modules/admin/validators/adminSystem.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const broadcastSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  body: Joi.string().trim().min(5).max(1000).required(),
  audience: Joi.string().valid("all", "student", "faculty", "alumni").optional()
});

const validateBroadcast = (req, res, next) => {
  const { error, value } = broadcastSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

module.exports = {
  validateBroadcast
};