// backend/src/modules/communities/models/CommunityMember.js
const mongoose = require("mongoose");
const { MEMBER_ROLES, MEMBER_ROLES_VALUES } = require("../constants/community.constants");

const communityMemberSchema = new mongoose.Schema({
  communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

  role: { type: String, enum: MEMBER_ROLES_VALUES, default: MEMBER_ROLES.MEMBER },

  joinedAt: { type: Date, default: Date.now },

  // Moderation
  mutedUntil: { type: Date, default: null },
  isBanned: { type: Boolean, default: false },
  bannedAt: { type: Date, default: null },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // Reserved for future "last active in community" feature — not
  // populated by any service yet, safe default so no migration later.
  lastSeenAt: { type: Date, default: null }
}, { timestamps: true, versionKey: false });

// One membership record per user per community — this is the backbone
// index every permission check in the module relies on.
communityMemberSchema.index({ communityId: 1, userId: 1 }, { unique: true });
// Fast "give me all leaders/moderators of this community" queries.
communityMemberSchema.index({ communityId: 1, role: 1 });

module.exports = mongoose.model("CommunityMember", communityMemberSchema);