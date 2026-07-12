// backend/src/modules/communities/models/Community.js
//
// FIX: duplicate schema index warning on {ownerId:1} — was declared
// BOTH via `index: true` on the field AND via a separate
// `communitySchema.index({ ownerId: 1 })` call below. Removed the
// field-level `index: true`; the standalone `.index()` call is kept
// since that's the pattern already used for tags/category/visibility/
// status combos in this file.
//
// UPDATED: `settings.requireApproval` was already on the schema but was
// dead weight — nothing read it. It's now wired up (see
// community.constants.js's requiresJoinRequest() and the two services
// that use it). Comment updated to reflect its real, active meaning.
// Also added a compound index matching the exact filter+sort shape
// listPublicCommunities() now runs (status + visibility, sorted by
// memberCount) — the individual `visibility: index:true` /
// `status: index:true` fields alone don't let Mongo use one efficient
// index for a combined filter+sort; this compound index does.

const mongoose = require("mongoose");
const {
  VISIBILITY, VISIBILITY_VALUES,
  COMMUNITY_STATUS, COMMUNITY_STATUS_VALUES,
  CATEGORIES
} = require("../constants/community.constants");

const communitySettingsSchema = new mongoose.Schema({
  allowMedia: { type: Boolean, default: true },
  allowLinks: { type: Boolean, default: true },
  allowFiles: { type: Boolean, default: true },
  allowVoice: { type: Boolean, default: true },
  allowExternalMembers: { type: Boolean, default: true }, // non-college users, future gate
  allowMentorPosts: { type: Boolean, default: true },

  // ACTIVE FIELD (previously dead): when true, even a PUBLIC community
  // requires a join request instead of instant join — see
  // community.constants.js's requiresJoinRequest(). Independent of
  // `visibility`; a PRIVATE community always requires a request
  // regardless of this flag, this only matters for PUBLIC ones.
  requireApproval: { type: Boolean, default: false }
}, { _id: false });

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  description: { type: String, trim: true, maxlength: 500, default: "" },
  rules: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },

  coverImage: { type: String, default: "" },
  coverImagePublicId: { type: String, default: "" },
  avatar: { type: String, default: "" },
  avatarPublicId: { type: String, default: "" },

  category: { type: String, enum: CATEGORIES, required: true },
  tags: { type: [{ type: String, trim: true, lowercase: true }], default: [] },

  visibility: { type: String, enum: VISIBILITY_VALUES, default: VISIBILITY.PUBLIC, index: true },
  status: { type: String, enum: COMMUNITY_STATUS_VALUES, default: COMMUNITY_STATUS.ACTIVE, index: true },

  // FIX: removed `index: true` here — was duplicating the standalone
  // `communitySchema.index({ ownerId: 1 })` call below, which caused
  // the Mongoose "Duplicate schema index" warning at boot.
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", default: null },
  settings: { type: communitySettingsSchema, default: () => ({}) },
  memberCount: { type: Number, default: 0, min: 0 },
  postCount: { type: Number, default: 0, min: 0 },
  isVerified: { type: Boolean, default: false },
  verificationBadge: { type: String, default: "" },
  createdByDepartment: { type: String, default: "" },
  collegeOnly: { type: Boolean, default: true },
  allowGuests: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

communitySchema.index({ tags: 1 });
communitySchema.index({ category: 1, visibility: 1, status: 1 });
communitySchema.index({ ownerId: 1 });

// Supports listPublicCommunities()'s exact query shape —
// filter on {status, visibility}, sort by memberCount desc.
communitySchema.index({ status: 1, visibility: 1, memberCount: -1 });

module.exports = mongoose.model("Community", communitySchema);