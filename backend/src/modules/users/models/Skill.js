// backend/src/modules/users/models/Skill.js
//
// FIX: Removed `skillSchema.index({ userId: 1 })`. The `userId` field
// already declares `index: true` inline below, and there's also a
// compound unique index `{ userId: 1, skillName: 1 }` further down —
// having a THIRD single-field index on the same field caused
// Mongoose's "Duplicate schema index" warning on server boot.
// No behavior change: userId lookups are still indexed (both via the
// field-level index and as the leading field of the compound index).

const mongoose = require("mongoose");

const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "expert"];
const SKILL_SOURCES = ["manual", "resume", "project", "certificate", "experience", "system"];

const proofSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    type: { type: String, trim: true, default: "other" }
  },
  { _id: false }
);

const skillSchema = new mongoose.Schema(
  {
    // index: true declared here — do NOT also add skillSchema.index({ userId: 1 }) below.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    skillName: { type: String, required: true, trim: true, lowercase: true, maxlength: 100 },
    category: { type: String, trim: true, default: "" },
    level: { type: String, enum: SKILL_LEVELS, default: "beginner" },
    yearsOfExperience: { type: Number, min: 0, default: 0 },
    source: { type: String, enum: SKILL_SOURCES, default: "manual" },
    proofs: { type: [proofSchema], default: [] },
    verified: { type: Boolean, default: false },
    endorsementCount: { type: Number, default: 0 },
    score: { type: Number, min: 0, max: 100, default: 0 },
    searchScore: { type: Number, default: 0 },
    tags: [{ type: String, trim: true, lowercase: true }],
    lastUsedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, versionKey: false }
);

// NOTE: `userId` single-field index removed from here — already declared
// via `index: true` above, and covered again as the leading field of the
// compound unique index below.
skillSchema.index({ skillName: 1 });
skillSchema.index({ category: 1 });
skillSchema.index({ level: 1 });
skillSchema.index({ tags: 1 });
skillSchema.index({ score: -1 });
skillSchema.index({ userId: 1, skillName: 1 }, { unique: true });

skillSchema.virtual("isStrongSkill").get(function () {
  return this.score >= 70;
});

skillSchema.virtual("isExpertSkill").get(function () {
  return this.level === "expert";
});

module.exports = mongoose.model("Skill", skillSchema);