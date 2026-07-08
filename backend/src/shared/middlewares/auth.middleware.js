// backend/src/shared/middlewares/auth.middleware.js
//
// Single file, two middlewares:
//   authMiddleware          → strict (token required, invalid/missing = block)
//   optionalAuthMiddleware  → soft (token ho to decode karo, na ho ya invalid ho to guest ki tarah aage jaane do)
// Dono same core verify+lookup logic share karte hain (resolveUserFromRequest), isliye
// kal agar tokenVersion/accountStatus check me kuch badalna ho, ek hi jagah badlega.

const jwt = require("jsonwebtoken");
const User = require("../../modules/auth/models/User");
const ApiError = require("../errors/ApiError");
const logger = require("../logger/logger");

const USER_SELECT_FIELDS = `
role
username
email
identityId
tokenVersion
accountStatus
isDeleted
`;

const resolveUserFromRequest = async (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { ok: false, reason: "NO_TOKEN" };
  }

  if (!process.env.JWT_SECRET) {
    return { ok: false, reason: "CONFIG_MISSING", statusCode: 500 };
  }

  const token = authHeader.substring(7).trim();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.warn("Invalid authentication token", { module: "Auth" });
    return { ok: false, reason: "INVALID_TOKEN", statusCode: 401 };
  }

  if (!decoded.id || typeof decoded.tokenVersion !== "number") {
    return { ok: false, reason: "INVALID_PAYLOAD", statusCode: 401 };
  }

  const user = await User.findById(decoded.id).select(USER_SELECT_FIELDS);

  if (!user) {
    return { ok: false, reason: "USER_NOT_FOUND", statusCode: 401 };
  }

  if (user.isDeleted) {
    return { ok: false, reason: "ACCOUNT_DELETED", statusCode: 401 };
  }

  if (user.accountStatus === "pending") {
    return { ok: false, reason: "ACCOUNT_PENDING", statusCode: 403 };
  }

  if (user.accountStatus === "rejected") {
    return { ok: false, reason: "ACCOUNT_REJECTED", statusCode: 403 };
  }

  if (user.accountStatus === "suspended") {
    return { ok: false, reason: "ACCOUNT_SUSPENDED", statusCode: 403 };
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    return { ok: false, reason: "SESSION_EXPIRED", statusCode: 401 };
  }

  return { ok: true, user };
};

const REASON_MESSAGES = {
  NO_TOKEN: "Authorization token missing",
  CONFIG_MISSING: "JWT configuration missing",
  INVALID_TOKEN: "Invalid or expired token",
  INVALID_PAYLOAD: "Invalid token payload",
  USER_NOT_FOUND: "User not found",
  ACCOUNT_DELETED: "Account no longer available",
  ACCOUNT_PENDING: "Account approval pending",
  ACCOUNT_REJECTED: "Account rejected",
  ACCOUNT_SUSPENDED: "Account suspended",
  SESSION_EXPIRED: "Session expired. Please login again."
};

const toReqUser = (user) => Object.freeze({
  id: user._id,
  role: user.role,
  username: user.username,
  email: user.email,
  identityId: user.identityId,
  tokenVersion: user.tokenVersion
});

// STRICT — existing behavior, unchanged externally.
const authMiddleware = async (req, res, next) => {
  try {
    const result = await resolveUserFromRequest(req);

    if (!result.ok) {
      const statusCode = result.statusCode || 401;
      return next(new ApiError(statusCode, REASON_MESSAGES[result.reason]));
    }

    req.user = toReqUser(result.user);

    logger.debug("Authenticated request", { module: "Auth", userId: result.user._id });
    next();
  } catch (error) {
    logger.error("Authentication middleware failed", error, { module: "Auth" });
    next(error);
  }
};

// OPTIONAL — soft version. Never blocks; sets req.user only when a fully valid session exists.
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const result = await resolveUserFromRequest(req);

    if (result.ok) {
      req.user = toReqUser(result.user);
    }
    // ok:false ke har case me (NO_TOKEN, INVALID_TOKEN, stale session, etc.)
    // hum guest ki tarah aage badhte hain — koi error throw nahi karte.
    // Exception: CONFIG_MISSING is a real server misconfig, not a client issue —
    // still don't block a public route for it, but log loudly so it gets noticed.
    if (!result.ok && result.reason === "CONFIG_MISSING") {
      logger.error("JWT configuration missing during optional auth", { module: "Auth" });
    }

    next();
  } catch (error) {
    // Kabhi bhi unexpected error aaye to bhi guest ki tarah aage badho — optional auth ka poora point hi ye hai.
    logger.warn("Optional auth middleware error, continuing as guest", { module: "Auth", error: error.message });
    next();
  }
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.optionalAuthMiddleware = optionalAuthMiddleware;