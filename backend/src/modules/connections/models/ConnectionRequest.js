// backend/src/modules/connections/models/ConnectionRequest.js
//
// The workflow record — NOT the relationship itself. Exactly the same
// separation Jobs keeps between Job and JobApplication, and Mentorship
// keeps between MentorProfile and MentorRequest: once accepted, the
// *outcome* lives in Connection.js, and this document's job is done.
// Never merge these two — mixing "pending request" and "active
// relationship" into one collection is the exact anti-pattern flagged
// in review (querying status==="accepted" vs status==="pending" against
// the same model that's supposed to represent two different things).

const mongoose = require("mongoose");
const {
  REQUEST_STATUS,
  REQUEST_STATUS_VALUES,
  LIMITS
} = require("../constants/connection.constants");

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: REQUEST_STATUS_VALUES, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: "" }
  },
  { _id: false }
);

const connectionRequestSchema = new mongoose.Schema(
  {
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    message: { type: String, trim: true, maxlength: LIMITS.MESSAGE_MAX, default: "" },

    status: {
      type: String,
      enum: REQUEST_STATUS_VALUES,
      default: REQUEST_STATUS.PENDING,
      index: true
    },
    statusHistory: { type: [statusHistorySchema], default: [] },

    respondedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, maxlength: LIMITS.REJECTION_REASON_MAX, default: "" }

    // This model has no idea Conversation, Notification, Recommendation,
    // or Search exist. It stores a request and its history — nothing
    // else. Cross-module effects (creating a conversation, notifying
    // the receiver) are triggered from connection.service.js, never
    // computed or stored here.
  },
  { timestamps: true, versionKey: false }
);

connectionRequestSchema.index({ requesterId: 1, status: 1 });
connectionRequestSchema.index({ receiverId: 1, status: 1 });
// Not unique — same reasoning as MentorRequest: a user can have multiple
// past (rejected/cancelled) requests with the same person over time.
// Preventing a duplicate *active* (pending) request between the same
// pair is a business rule checked in the service layer.

module.exports = mongoose.model("ConnectionRequest", connectionRequestSchema);