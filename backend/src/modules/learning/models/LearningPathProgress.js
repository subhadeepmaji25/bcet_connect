// backend/src/modules/learning/models/LearningPathProgress.js
//
// NEW MODULE — Learning (Career Learning domain, Phase 4).
// Direct structural mirror of LearningProgress.js (per-RESOURCE
// tracking), just one level up — per-PATH instead. Same reasons that
// file is its own collection apply here unchanged: enrollment/step-
// completion is a high-frequency, per-user write (every step toggle),
// so it does NOT belong embedded on LearningPath itself the way
// steps[] is embedded there (steps[] is authored once by Faculty/Admin
// and read far more than written — see LearningPath.js's own file
// header for that distinction). This collection is the opposite
// profile: written constantly by many students against one path.
//
// completedStepIds stores raw ObjectIds, NOT a `ref` to a step
// sub-document — Mongoose can't populate into an embedded array
// element by _id the way it populates a real collection, and
// LearningPath.js's pathStepSchema was given `{ _id: true }`
// specifically so THIS file has a stable id to store here (see that
// schema's own inline comment). Resolving a completedStepId back to
// its step content is a service-layer lookup against
// LearningPath.steps, not a Mongoose populate.

const mongoose = require("mongoose");

// Same three-state shape LearningProgress.js's PROGRESS_STATUS already
// uses for resources — kept as an independent local enum here (not a
// shared import) for the same reason LearningPath.js's own PATH_STATUS
// is a local, unexported enum: promote to a shared constants file only
// once a THIRD file needs it, not preemptively.
const PATH_PROGRESS_STATUS = Object.freeze({
  STARTED: "started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
});
const PATH_PROGRESS_STATUS_VALUES = Object.freeze(Object.values(PATH_PROGRESS_STATUS));

const learningPathProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    pathId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningPath", required: true, index: true },

    status: { type: String, enum: PATH_PROGRESS_STATUS_VALUES, default: PATH_PROGRESS_STATUS.STARTED },

    // Denormalized, same as LearningProgress.completionPercent — kept
    // in sync by learningPath.service.js's updateStepProgress()
    // whenever completedStepIds changes, rather than recomputed live
    // on every read against LearningPath.steps.length.
    completionPercent: { type: Number, min: 0, max: 100, default: 0 },

    // The actual source of truth for "which steps has this student
    // finished" — completionPercent above is just its cached
    // percentage view.
    completedStepIds: { type: [{ type: mongoose.Schema.Types.ObjectId }], default: [] },

    enrolledAt: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

// One progress record per (student, path) — same uniqueness shape
// LearningProgress.js enforces per (student, resource). enrollInPath()
// relies on this to detect "already enrolled" instead of re-deriving
// it from a separate lookup.
learningPathProgressSchema.index({ userId: 1, pathId: 1 }, { unique: true });
// "My in-progress paths" dashboard — mirrors LearningProgress.js's own
// { userId, status, lastOpenedAt } index for the identical read shape.
learningPathProgressSchema.index({ userId: 1, status: 1, lastActivityAt: -1 });
// Faculty/Admin-facing "how many students are on this path and where"
// — mirrors LearningProgress.js's { resourceId, status } index.
learningPathProgressSchema.index({ pathId: 1, status: 1 });

module.exports = mongoose.model("LearningPathProgress", learningPathProgressSchema);
module.exports.PATH_PROGRESS_STATUS = PATH_PROGRESS_STATUS;
module.exports.PATH_PROGRESS_STATUS_VALUES = PATH_PROGRESS_STATUS_VALUES;