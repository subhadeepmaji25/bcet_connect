// backend/src/modules/admin/services/adminUser.service.js
//
// CRITICAL CONTEXT: register.service.js sets accountStatus:"pending" for
// faculty/alumni, and login.service.js blocks "pending" accounts. This
// service is the missing transition layer for that.
//
// UPGRADE 1: suspensionType field distinguishes ban vs suspend at the
// schema level (not just audit-log level) — requires a matching field
// added to auth/models/User.js (see note at bottom of this response).
// UPGRADE 2: every mutation now calls adminAuditLog.service.js's
// logAction() for a persisted, queryable action history.

const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { ADMIN_ACTIONS } = require("../constants/admin.constants");
const { logAction } = require("./adminAuditLog.service");

const loadUserOrThrow = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) throw ApiError.notFound("User not found");
  return user;
};

const approveUser = async (userId, adminId) => {
  const user = await loadUserOrThrow(userId);
  if (user.role === "admin") throw ApiError.forbidden("Admin accounts cannot be modified through this endpoint");
  if (user.accountStatus !== "pending") throw ApiError.badRequest(`User is already ${user.accountStatus}, cannot approve`);

  const previousStatus = user.accountStatus;
  user.accountStatus = "active";
  await user.save();

  await notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, {
    userId: user._id,
    data: { title: "Account approved", body: "Your account has been verified and approved by the admin. You can now log in." },
    meta: { adminId, action: ADMIN_ACTIONS.APPROVE }
  });

  await logAction({
    adminId, action: ADMIN_ACTIONS.APPROVE, targetType: "user", targetId: user._id,
    metadata: { previousStatus, newStatus: "active", role: user.role }
  });

  return { success: true, message: "User approved successfully", data: { user: sanitizeUser(user) } };
};

const rejectUser = async (userId, adminId, rejectionReason = "") => {
  const user = await loadUserOrThrow(userId);
  if (user.role === "admin") throw ApiError.forbidden("Admin accounts cannot be modified through this endpoint");
  if (user.accountStatus !== "pending") throw ApiError.badRequest(`User is already ${user.accountStatus}, cannot reject`);

  const previousStatus = user.accountStatus;
  user.accountStatus = "rejected";
  await user.save();

  await notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, {
    userId: user._id,
    data: {
      title: "Account rejected",
      body: rejectionReason ? `Your account application was rejected. Reason: ${rejectionReason}` : "Your account application was rejected by the admin."
    },
    meta: { adminId, action: ADMIN_ACTIONS.REJECT, rejectionReason }
  });

  await logAction({
    adminId, action: ADMIN_ACTIONS.REJECT, targetType: "user", targetId: user._id, reason: rejectionReason,
    metadata: { previousStatus, newStatus: "rejected", role: user.role }
  });

  return { success: true, message: "User rejected", data: { user: sanitizeUser(user) } };
};

const suspendUser = async (userId, adminId, reason = "") => {
  const user = await loadUserOrThrow(userId);
  if (user.role === "admin") throw ApiError.forbidden("Admin accounts cannot be modified through this endpoint");
  if (user.accountStatus === "suspended") throw ApiError.badRequest("User is already suspended");

  const previousStatus = user.accountStatus;
  user.accountStatus = "suspended";
  // UPGRADE: persisted distinction from ban — requires User.js to have
  // suspensionType: { type: String, enum: ["suspend","ban",null], default: null }
  user.suspensionType = "suspend";
  await user.invalidateSessions();

  await notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, {
    userId: user._id,
    data: { title: "Account suspended", body: reason ? `Your account has been suspended by the admin. Reason: ${reason}` : "Your account has been suspended by the admin." },
    meta: { adminId, action: ADMIN_ACTIONS.SUSPEND, reason }
  });

  await logAction({
    adminId, action: ADMIN_ACTIONS.SUSPEND, targetType: "user", targetId: user._id, reason,
    metadata: { previousStatus, newStatus: "suspended", suspensionType: "suspend", role: user.role }
  });

  return { success: true, message: "User suspended successfully", data: { user: sanitizeUser(user) } };
};

const banUser = async (userId, adminId, reason = "") => {
  const user = await loadUserOrThrow(userId);
  if (user.role === "admin") throw ApiError.forbidden("Admin accounts cannot be modified through this endpoint");

  const previousStatus = user.accountStatus;
  user.accountStatus = "suspended";
  user.suspensionType = "ban";
  await user.invalidateSessions();

  await notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, {
    userId: user._id,
    data: { title: "Account banned", body: reason ? `Your account has been banned by the admin. Reason: ${reason}` : "Your account has been banned by the admin." },
    meta: { adminId, action: ADMIN_ACTIONS.BAN, reason }
  });

  await logAction({
    adminId, action: ADMIN_ACTIONS.BAN, targetType: "user", targetId: user._id, reason,
    metadata: { previousStatus, newStatus: "suspended", suspensionType: "ban", role: user.role }
  });

  return { success: true, message: "User banned successfully", data: { user: sanitizeUser(user) } };
};

const activateUser = async (userId, adminId) => {
  const user = await loadUserOrThrow(userId);
  if (user.role === "admin") throw ApiError.forbidden("Admin accounts cannot be modified through this endpoint");
  if (user.accountStatus === "active") throw ApiError.badRequest("User is already active");

  const previousStatus = user.accountStatus;
  const previousSuspensionType = user.suspensionType;
  user.accountStatus = "active";
  user.suspensionType = null;
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await notify(NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT, {
    userId: user._id,
    data: { title: "Account reactivated", body: "Your account has been reactivated by the admin. You can now log in." },
    meta: { adminId, action: ADMIN_ACTIONS.ACTIVATE }
  });

  await logAction({
    adminId, action: ADMIN_ACTIONS.ACTIVATE, targetType: "user", targetId: user._id,
    metadata: { previousStatus, previousSuspensionType, newStatus: "active", role: user.role }
  });

  return { success: true, message: "User activated successfully", data: { user: sanitizeUser(user) } };
};

const getPendingUsers = async ({ role, page = 1, limit = 20 } = {}) => {
  const filter = { accountStatus: "pending", isDeleted: false };
  if (role) filter.role = role;
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select("role username email identityId accountStatus createdAt").sort({ createdAt: 1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter)
  ]);
  return { users, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
};

const listUsers = async ({ role, accountStatus, suspensionType, search, page = 1, limit = 20 } = {}) => {
  const filter = { isDeleted: false };
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (suspensionType) filter.suspensionType = suspensionType;
  if (search) {
    const term = search.trim();
    filter.$or = [
      { username: new RegExp(term, "i") },
      { email: new RegExp(term, "i") },
      { identityId: new RegExp(term, "i") }
    ];
  }
  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select("role username email identityId accountStatus suspensionType lastLoginAt lastSeenAt createdAt").sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter)
  ]);
  return { users, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
};

const getUserById = async (userId) => {
  const user = await User.findOne({ _id: userId, isDeleted: false })
    .select("role username email identityId accountStatus suspensionType emailVerified profileCreated lastLoginAt lastSeenAt loginAttempts lockUntil createdAt");
  if (!user) throw ApiError.notFound("User not found");
  return { success: true, message: "User fetched", data: { user } };
};

const sanitizeUser = (user) => ({
  id: user._id, role: user.role, username: user.username, email: user.email,
  identityId: user.identityId, accountStatus: user.accountStatus, suspensionType: user.suspensionType || null
});

module.exports = { approveUser, rejectUser, suspendUser, banUser, activateUser, getPendingUsers, listUsers, getUserById };