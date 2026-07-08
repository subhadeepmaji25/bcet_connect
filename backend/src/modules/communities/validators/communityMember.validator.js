// backend/src/modules/communities/validators/communityMember.validator.js
//
// FIXED: memberParamsSchema's error message ("id must be valid") is exactly
// the text you were seeing on promote failures — that confirms the request
// was reaching this validator with a malformed :userId. The real fix for
// WHY it was malformed is in communityMember.service.js (getMembers() no
// longer leaks a nested populate object for the frontend to accidentally
// send back as an ID). Kept here: split the message per-field so future
// debugging tells you WHICH param was bad, not just "id must be valid".
//
// ADDED (this update): banMemberSchema — validates the optional `reason`
// string on the new ban endpoint. unmute/unban reuse validateMemberParams
// only, since they take no body (mutedUntil is just cleared / isBanned is
// just flipped back to false server-side, both handled in the service).

const Joi = require("joi");
const ApiError = require("../../../shared/errors/ApiError");
const { MEMBER_ROLES_VALUES } = require("../constants/community.constants");

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

// Note: "owner" intentionally excluded from assignable roles here —
// ownership can only move via the dedicated transferOwnership flow,
// never through the generic changeRole endpoint (service layer also
// blocks this independently, this is just the first line of defense).
const ASSIGNABLE_ROLES = MEMBER_ROLES_VALUES.filter((r) => r !== "owner");

const changeRoleSchema = Joi.object({
  newRole: Joi.string().valid(...ASSIGNABLE_ROLES).required()
});

const transferOwnershipSchema = Joi.object({
  newOwnerUserId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "newOwnerUserId must be a valid id" })
});

const muteMemberSchema = Joi.object({
  mutedUntil: Joi.date().greater("now").required()
    .messages({ "date.greater": "mutedUntil must be a future date" })
});

// NEW — reason is optional and capped so nobody stuffs an essay in here;
// banMember()/unbanMember() in the service store it as banReason.
const banMemberSchema = Joi.object({
  reason: Joi.string().trim().max(300).allow("", null).optional()
});

// FIX: per-field messages instead of one shared message on the whole
// schema — previously both communityId and userId failures produced the
// identical generic "id must be valid" text, making it impossible to
// tell from the error alone which param was actually malformed.
const memberParamsSchema = Joi.object({
  communityId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "communityId must be a valid id" }),
  userId: Joi.string().pattern(OBJECT_ID_PATTERN).required()
    .messages({ "string.pattern.base": "userId must be a valid id — check that the frontend is sending the member's user id (member.id), not the populated user object or the membership document id" })
});

const listMembersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional()
});

const validateChangeRole = (req, res, next) => {
  const { error, value } = changeRoleSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateTransferOwnership = (req, res, next) => {
  const { error, value } = transferOwnershipSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateMuteMember = (req, res, next) => {
  const { error, value } = muteMemberSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

// NEW
const validateBanMember = (req, res, next) => {
  const { error, value } = banMemberSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.body = value;
  next();
};

const validateMemberParams = (req, res, next) => {
  const { error } = memberParamsSchema.validate(req.params, { abortEarly: false });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  next();
};

const validateListMembersQuery = (req, res, next) => {
  const { error, value } = listMembersQuerySchema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) return next(ApiError.badRequest(error.details.map((d) => d.message).join(", ")));
  req.query = value;
  next();
};

module.exports = {
  validateChangeRole,
  validateTransferOwnership,
  validateMuteMember,
  validateBanMember,
  validateMemberParams,
  validateListMembersQuery
};