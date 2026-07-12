// backend/src/modules/events/validators/event.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { EVENT_CATEGORIES } = require("../constants/event.constants");

const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().min(20).max(10000).required(),
  category: Joi.string().valid(...EVENT_CATEGORIES).optional(),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20).optional(),
  venue: Joi.string().trim().max(200).allow("").optional(),
  isVirtual: Joi.boolean().optional(),
  meetingLink: Joi.string().uri().allow(null, "").optional(),
  startTime: Joi.date().greater("now").required(),
  endTime: Joi.date().required(),
  registrationDeadline: Joi.date().optional(),
  capacity: Joi.number().integer().min(1).allow(null).optional(),
  bannerUrl: Joi.string().uri().allow(null, "").optional(),
  attachments: Joi.array().items(Joi.string().uri()).max(10).optional(),
  targetRoles: Joi.array().items(Joi.string().valid("student", "faculty", "alumni")).optional(),
  agenda: Joi.array().items(Joi.object({
    time: Joi.string().trim().max(20).required(),
    title: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(1000).optional(),
    speaker: Joi.string().trim().max(150).optional()
  })).max(30).optional(),
  communityId: Joi.string().hex().length(24).optional()
}).custom((value, helpers) => {
  if (new Date(value.endTime) <= new Date(value.startTime)) {
    return helpers.message("endTime must be after startTime");
  }
  if (value.registrationDeadline && new Date(value.registrationDeadline) > new Date(value.startTime)) {
    return helpers.message("registrationDeadline cannot be after startTime");
  }
  return value;
});

const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150),
  description: Joi.string().trim().min(20).max(10000),
  category: Joi.string().valid(...EVENT_CATEGORIES),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20),
  venue: Joi.string().trim().max(200).allow(""),
  isVirtual: Joi.boolean(),
  meetingLink: Joi.string().uri().allow(null, ""),
  startTime: Joi.date(),
  endTime: Joi.date(),
  registrationDeadline: Joi.date(),
  capacity: Joi.number().integer().min(1).allow(null),
  bannerUrl: Joi.string().uri().allow(null, ""),
  attachments: Joi.array().items(Joi.string().uri()).max(10),
  targetRoles: Joi.array().items(Joi.string().valid("student", "faculty", "alumni")),
  agenda: Joi.array().items(Joi.object({
    time: Joi.string().trim().max(20).required(),
    title: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(1000).optional(),
    speaker: Joi.string().trim().max(150).optional()
  })).max(30)
}).min(1);

const rejectEventSchema = Joi.object({
  rejectionReason: Joi.string().trim().min(5).max(500).required()
});

const cancelEventSchema = Joi.object({
  cancelReason: Joi.string().trim().max(500).allow("").optional()
});

const validate = (schema, source = "body") => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req[source] = value;
  next();
};

module.exports = {
  validateCreateEvent: validate(createEventSchema),
  validateUpdateEvent: validate(updateEventSchema),
  validateRejectEvent: validate(rejectEventSchema),
  validateCancelEvent: validate(cancelEventSchema)
};
