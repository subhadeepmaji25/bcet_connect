// backend/src/modules/events/validators/eventAttendance.validator.js
const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

// Body for POST /:eventId/attendance/checkin/token — the QR payload
// scanned by the organizer, decoded client-side into a raw JWT string.
const checkInByTokenSchema = Joi.object({
  token: Joi.string().trim().required()
});

// Body for POST /:eventId/attendance/checkin/manual — organizer picks a
// target registrant directly, no QR/token involved.
const checkInManuallySchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

const listAttendanceQuerySchema = Joi.object({
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
  validateCheckInByToken: validate(checkInByTokenSchema),
  validateCheckInManually: validate(checkInManuallySchema),
  validateListAttendanceQuery: validate(listAttendanceQuerySchema, "query")
};