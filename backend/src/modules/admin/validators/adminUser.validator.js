// backend/src/modules/admin/validators/adminUser.validator.js
const Joi = require("joi");
const mongoose = require("mongoose");
const ApiError = require("../../../shared/errors/ApiError");

const objectIdParam = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) return helpers.error("any.invalid");
  return value;
}, "ObjectId validation").messages({ "any.invalid": "Invalid user ID format" });

const userIdParamSchema = Joi.object({ userId: objectIdParam.required() });

const reasonBodySchema = Joi.object({ reason: Joi.string().trim().min(5).max(500).allow("").optional() });

const rejectUserBodySchema = Joi.object({ reason: Joi.string().trim().min(5).max(500).required() });

// UPGRADE: suspensionType filter added — lets the dashboard query
// "show me only banned users" vs "only suspended users" directly.
//
// FIX: every filter field now has .allow("") alongside .optional().
// Frontend "All" dropdown options send an empty-string query param
// (?role=&accountStatus=&suspensionType=&search=) instead of omitting the
// key entirely. Joi treats "key present but empty" differently from "key
// missing" — .optional() alone only covers the missing case, so without
// .allow("") every "All" filter selection was rejected with
// "is not allowed to be empty". Service layer (adminUser.service.js) already
// does `if (role) filter.role = role` truthy checks, so an empty string
// safely falls through and is excluded from the Mongo filter — no service
// change needed, this was purely a validator gap.
const listUsersQuerySchema = Joi.object({
  role: Joi.string().valid("student", "faculty", "alumni", "admin").allow("").optional(),
  accountStatus: Joi.string().valid("pending", "active", "rejected", "suspended").allow("").optional(),
  suspensionType: Joi.string().valid("suspend", "ban").allow("").optional(),
  search: Joi.string().trim().max(100).allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const pendingUsersQuerySchema = Joi.object({
  role: Joi.string().valid("student", "faculty", "alumni").allow("").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

const validateUserIdParam = (req, res, next) => {
  const { error, value } = userIdParamSchema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.params = value;
  next();
};

const validateReasonBody = (req, res, next) => {
  const { error, value } = reasonBodySchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateRejectUserBody = (req, res, next) => {
  const { error, value } = rejectUserBodySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateListUsersQuery = (req, res, next) => {
  const { error, value } = listUsersQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

const validatePendingUsersQuery = (req, res, next) => {
  const { error, value } = pendingUsersQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateUserIdParam, validateReasonBody, validateRejectUserBody,
  validateListUsersQuery, validatePendingUsersQuery
};