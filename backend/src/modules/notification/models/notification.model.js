// backend/src/modules/notification/models/notification.model.js
const mongoose = require("mongoose");
const {
  NOTIFICATION_CATEGORY_VALUES,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_PRIORITY_VALUES,
  NOTIFICATION_STATUS_VALUES,
  NOTIFICATION_STATUS,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_TYPE,
  DEFAULT_EXPIRY_DAYS,
  EXPIRY_DAYS_BY_CATEGORY
} = require("../constants/notification.constants");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    event: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: NOTIFICATION_CATEGORY_VALUES,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      default: NOTIFICATION_TYPE.INFO
    },
    priority: {
      type: String,
      enum: NOTIFICATION_PRIORITY_VALUES,
      default: NOTIFICATION_PRIORITY.NORMAL
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    actionType: {
      type: String,
      default: null
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    status: {
      type: String,
      enum: NOTIFICATION_STATUS_VALUES,
      default: NOTIFICATION_STATUS.UNREAD,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    archivedAt: {
      type: Date,
      default: null
    },
    // FIX: was a flat `DEFAULT_EXPIRY_DAYS` for every notification,
    // regardless of category — EXPIRY_DAYS_BY_CATEGORY existed in
    // constants but was never actually consumed anywhere. `this` must
    // be a real function (not an arrow) for Mongoose to bind it to the
    // document being created, so `this.category` resolves correctly.
    expiresAt: {
      type: Date,
      default: function () {
        const days = EXPIRY_DAYS_BY_CATEGORY[this.category] || DEFAULT_EXPIRY_DAYS;
        return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }
  },
  { timestamps: true }
);

// Fast "my inbox" queries: userId + status, newest first.
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Category filter: GET /notifications?category=JOB
notificationSchema.index({ userId: 1, category: 1, createdAt: -1 });

// FIX: this was a plain index on `expiresAt` with no `expireAfterSeconds`
// — MongoDB was never actually deleting anything based on it, so
// `expiresAt` was a dead field despite looking functional. This is now
// a REAL TTL index, but with `partialFilterExpression` so it honors the
// original design intent above ("archived history queryable on demand"):
// only UNREAD/READ notifications get auto-deleted once expiresAt passes;
// anything the user has explicitly archived is excluded from TTL cleanup
// and persists until they delete it themselves.
notificationSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: { $ne: NOTIFICATION_STATUS.ARCHIVED } }
  }
);

module.exports = mongoose.model("Notification", notificationSchema);