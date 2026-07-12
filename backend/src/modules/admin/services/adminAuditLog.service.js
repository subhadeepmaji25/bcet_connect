// backend/src/modules/admin/services/adminAuditLog.service.js
//
// Single write entry point + single read entry point for AdminAuditLog.
// Every other admin service calls logAction() — none import the model
// directly, keeping "one file owns one collection" discipline intact.
//
// FIX: adminAuditLog.controller.js calls getAuditLogById(), which never
// existed here — added it below so the controller's already-wired
// function doesn't crash if that route is ever registered.

const mongoose = require("mongoose");
const AdminAuditLog = require("../models/AdminAuditLog");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

// Never throws — an audit-log write failure must never block the actual
// admin action from succeeding. Failure is logged loudly instead.
const logAction = async ({ adminId, action, targetType, targetId = null, reason = "", metadata = {} }) => {
  try {
    await AdminAuditLog.create({
      adminId,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      reason,
      metadata
    });
  } catch (err) {
    logger.error("[adminAuditLog] Failed to write audit log entry", err, {
      module: "Admin",
      adminId,
      action,
      targetType,
      targetId
    });
  }
};

const getAuditLogs = async ({ adminId, action, targetType, targetId, from, to, page = 1, limit = 20 } = {}) => {
  const filter = {};
  if (adminId) filter.adminId = adminId;
  if (action) filter.action = action;
  if (targetType) filter.targetType = targetType;
  if (targetId) filter.targetId = String(targetId);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .populate("adminId", "username email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    AdminAuditLog.countDocuments(filter)
  ]);

  return {
    logs,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

// NEW: single-entry read, matches adminAuditLog.controller.js's
// getAuditLogByIdController — this route isn't wired in admin.routes.js
// yet, but the controller already calls this, so it must exist to avoid
// a crash the moment it's registered.
const getAuditLogById = async (logId) => {
  if (!mongoose.Types.ObjectId.isValid(logId)) {
    throw ApiError.badRequest("Invalid audit log ID format");
  }

  const log = await AdminAuditLog.findById(logId).populate("adminId", "username email role").lean();
  if (!log) throw ApiError.notFound("Audit log entry not found");

  return log;
};

module.exports = { logAction, getAuditLogs, getAuditLogById };