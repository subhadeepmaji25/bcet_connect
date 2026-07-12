// backend/src/modules/events/validators/eventCertificate.validator.js
//
// FIXED: this file previously contained the routes-file code instead of
// a Joi validator (looks like a copy-paste mix-up in the repo — the
// exact contents of event.routes.js had ended up saved here instead).
// That meant validateIssueCertificate / validateListCertificatesQuery,
// which event.routes.js imports, never actually existed — requiring
// them returned `undefined`, and handing `undefined` to router.post()
// as a middleware throws at boot ("Route.post() requires a callback
// function but got a Undefined"). Rebuilt here following the exact
// same validate()/Joi shape eventFeedback.validator.js and
// eventAttendance.validator.js already use, so schema/validator
// discipline stays consistent across the whole Events module.

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");

// Body for POST /:eventId/certificates — organizer/admin issues a
// certificate to one specific attendee. userId is the target attendee,
// not the caller (caller identity comes from req.user via authMiddleware).
const issueCertificateSchema = Joi.object({
  userId: Joi.string().hex().length(24).required()
});

const listCertificatesQuerySchema = Joi.object({
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
  validateIssueCertificate: validate(issueCertificateSchema),
  validateListCertificatesQuery: validate(listCertificatesQuerySchema, "query")
};