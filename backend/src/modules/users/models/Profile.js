// backend/src/modules/users/models/Profile.js
//
// FIX: Removed `profileSchema.index({ role: 1 })`. The `role` field
// already declares `index: true` inline below — having both caused
// Mongoose's "Duplicate schema index" warning on server boot.
// No behavior change: the index still exists, it's just declared once.
//
// UPDATED (Learning module foundation): Added `semester`, `section`,
// `isCR`. Academic Learning's visibility hierarchy (Department →
// Semester → Subject → Resources) reads these three fields directly
// off Profile — nothing else on the model changes, and no existing
// query/index is touched. `currentYear` (1-4) is deliberately left
// alone and NOT used to derive semester — 1 year = 2 semesters, so
// deriving one from the other is ambiguous. Faculty/student sets
// `semester` explicitly during profile setup instead.
//
// `isCR` is intentionally NOT part of the student-editable Joi schema
// (see profile.validator.js) — it can only be flipped by a future
// Faculty-only endpoint, never by the student's own profile-update
// route. Kept here on Profile (not a separate collection) for the same
// "future-proof flag on User/Profile" reasoning already used for
// `isMentor`.

const mongoose = require("mongoose");

const PROFILE_VISIBILITY = ["public", "private"];
const PROFILE_STATUS = ["active", "inactive"];

const socialLinksSchema = new mongoose.Schema(
  {
    github: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    website: { type: String, default: "" }
  },
  { _id: false }
);

const profileStatsSchema = new mongoose.Schema(
  {
    profileViews: { type: Number, default: 0 },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    mentorshipSessionsCount: { type: Number, default: 0 },
    communitiesCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    // index: true declared here — do NOT also add profileSchema.index({ role: 1 }) below.
    role: {
      type: String,
      enum: ["student", "faculty", "alumni", "admin"],
      required: true,
      index: true
    },

    slug: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    headline: { type: String, trim: true, maxlength: 120, default: "" },
    bio: { type: String, maxlength: 1000, default: "" },
    avatar: { type: String, default: "" },
    avatarPublicId: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    coverImagePublicId: { type: String, default: "" },
    branch: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    currentYear: { type: Number, min: 1, max: 4 },
    passoutYear: { type: Number },
    currentCompany: { type: String, trim: true, default: "" },
    currentRole: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    profileCompletion: { type: Number, min: 0, max: 100, default: 0 },
    recommendationEnabled: { type: Boolean, default: false },
    isMentor: { type: Boolean, default: false },
    interests: [{ type: String, trim: true, lowercase: true }],
    searchableSkills: [{ type: String, trim: true, lowercase: true }],
    searchScore: { type: Number, default: 0 },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
    visibility: { type: String, enum: PROFILE_VISIBILITY, default: "public" },
    profileStatus: { type: String, enum: PROFILE_STATUS, default: "active" },
    stats: { type: profileStatsSchema, default: () => ({}) },
    lastActiveAt: { type: Date, default: Date.now },

    // ── Learning module foundation (Academic Learning hierarchy) ──
    // Nullable/empty by default — existing users won't break on schema
    // load, they just won't see semester/section-scoped resources until
    // they fill this in via profile update.
    semester: { type: Number, min: 1, max: 8, default: null },
    section: { type: String, trim: true, uppercase: true, default: "" },

    // Class Representative flag. Faculty-set only — see profile.service.js
    // comment on why this is excluded from ALLOWED_PROFILE_FIELDS.
    isCR: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

// Text search index
profileSchema.index({ fullName: "text", headline: "text", bio: "text", branch: "text", department: "text" });

// NOTE: `role` index removed from here — already declared via `index: true` above.
profileSchema.index({ currentCompany: 1 });
profileSchema.index({ passoutYear: 1 });
profileSchema.index({ profileCompletion: 1 });
profileSchema.index({ interests: 1 });
profileSchema.index({ searchableSkills: 1 });
profileSchema.index({ isMentor: 1 });
profileSchema.index({ recommendationEnabled: 1 });

// NEW — supports Learning module's exact filter shape: "resources visible
// to department X, semester Y" and "who are the CRs in dept X, semester Y,
// section Z" (Faculty's CR-assignment dashboard). Compound, same reasoning
// as Community.js's { status, visibility, memberCount } index — a query
// filtering on department+semester+section benefits from one compound
// index rather than three separate single-field ones.
profileSchema.index({ department: 1, semester: 1, section: 1 });
profileSchema.index({ isCR: 1 });

profileSchema.virtual("isProfileReady").get(function () {
  return this.profileCompletion >= 60;
});

module.exports = mongoose.model("Profile", profileSchema);