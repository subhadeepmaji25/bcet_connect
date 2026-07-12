// backend/src/modules/admin/models/AdminAuditLog.js
//
// Persisted record of every admin action — approve/reject/suspend/ban/
// activate/broadcast/moderate — so "which admin did what, when, why" is
// queryable from a dashboard instead of living only in log files.

const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Kept as free-form string, not a strict enum tied to one constants
    // list — approve/reject, moderation actions, and broadcasts all log
    // here and each has its own action vocabulary.
    action: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    targetId: {
      type: String,
      default: null,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      default: ""
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);