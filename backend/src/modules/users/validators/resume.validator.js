// backend/src/modules/users/validators/resume.validator.js
//
// Upload/replace routes ab multer se pehle guzarte hain, isliye resumeUrl,
// fileName, fileSize, mimeType — in sab ki JOI validation ki zaroorat
// nahi rahi (wo file object se derive hote hain, client kabhi bhejta nahi).
// Sirf metadata-only update (isDefault) ke liye body validation bachi hai.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

const updateResumeSchema = Joi.object({
  isDefault: Joi.boolean().required()
}).min(1);

const validateUpdateResume = (req, res, next) => {
  const { error, value } = updateResumeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  }
  req.body = value;
  next();
};

module.exports = { updateResumeSchema, validateUpdateResume };