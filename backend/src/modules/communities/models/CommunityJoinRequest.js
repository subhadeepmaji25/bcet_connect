// backend/src/modules/communities/models/CommunityJoinRequest.js
const mongoose = require("mongoose");
const { JOIN_REQUEST_STATUS, JOIN_REQUEST_STATUS_VALUES } = require("../constants/community.constants");

const communityJoinRequestSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  // Optional note from requester — useful context for private communities
  // ("Hi, I'm interested in AI" per review feedback).
  message: { type: String, trim: true, maxlength: 300, default: "" },

  status: { type: String, enum: JOIN_REQUEST_STATUS_VALUES, default: JOIN_REQUEST_STATUS.PENDING, index: true },

  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  respondedAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

// Partial unique index: only ONE pending request per user per community
// at a time. After reject/approve, status changes away from "pending"
// so the index no longer blocks a fresh request — this is what allows
// "reject once, request again later" while still preventing spam.
communityJoinRequestSchema.index(
  { communityId: 1, userId: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("CommunityJoinRequest", communityJoinRequestSchema);