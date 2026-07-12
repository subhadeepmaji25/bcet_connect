// backend/src/modules/learning/models/LearningPath.js
//
// NEW MODULE — Learning (Career Learning domain, Phase 5).
//
// This is the FIRST Career Learning model — everything else built so
// far (Subject/LearningResource/ResourceBookmark/etc.) was Academic
// Learning. Deliberately kept in the SAME `learning` module folder, not
// split into a separate `career-learning` module — Users/Notification/
// Recommendation dependencies are identical for both, and splitting now
// would just mean two routes files importing the same middlewares.
// Split later ONLY if Career Learning genuinely outgrows this file
// count, same "don't split preemptively" restraint communities/feed
// already show toward their own sub-concerns.
//
// careerTrack REUSES jobs/models/Job.js's JOB_CATEGORIES verbatim
// (imported, not copy-pasted) — this is the single most important
// design decision here. The brainstorm doc's "Learning + Jobs" section
// asks for "Job needs Express, Student has Python+MongoDB, System
// suggests Express Learning Path" — that matching is only possible if
// LearningPath.careerTrack and Job.category are drawn from the EXACT
// SAME enum, never two independently-maintained lists that could drift
// apart. If Jobs ever adds a new category, LearningPath automatically
// gains it too, with zero changes here.
//
// steps[] is an embedded array, NOT a separate collection — unlike
// ResourceBookmark/ResourceComment (which are separate collections
// because they're high-frequency, per-user writes), a path's steps are
// authored ONCE by Faculty/Admin and read far more often than written.
// Embedding avoids a join on every single "show me this path" read,
// same reasoning FeedPost.js embeds its own attachments array instead
// of a separate Attachment collection.
//
// Enrollment/per-user step-completion tracking is DELIBERATELY NOT in
// this file — that's a future LearningPathProgress collection (mirrors
// LearningProgress.js's per-resource discipline, just at the path
// level), out of scope for this pass. This model only owns the PATH
// DEFINITION itself; enrolledCount here is a simple denormalized
// counter (same pattern Subject.resourceCount/Community.memberCount
// already use), not a live join against enrollment records.

const mongoose = require("mongoose");
const { JOB_CATEGORIES } = require("../../jobs/models/Job");
const { DIFFICULTY_VALUES } = require("../constants/resource.constants");

// Kept as a local, unexported enum — same "small inline enum, no
// separate constants file needed" choice LearningProgress.js/
// ResourceComment.js already make for their own status fields. If a
// second file outside this one ever needs PATH_STATUS, promote it to
// constants/learningPath.constants.js at that point, not before.
const PATH_STATUS = Object.freeze({
  DRAFT: "draft",       // Faculty/Admin still building it, not visible to students
  PUBLISHED: "published",
  ARCHIVED: "archived"  // retired, hidden from new enrollment, existing enrollees unaffected
});
const PATH_STATUS_VALUES = Object.freeze(Object.values(PATH_STATUS));

// Each step points at EITHER a LearningResource (existing Academic
// content: notes/PPT/PYQ already uploaded) OR an externalUrl (a
// curated outside link — a YouTube course, official docs) — same
// "resource vs external link" duality resource.constants.js's
// LINK_ONLY_TYPES already established, reused here at the step level
// instead of re-deriving a new rule.
const pathStepSchema = new mongoose.Schema({
  order: { type: Number, required: true, min: 1 },
  title: { type: String, trim: true, required: true, maxlength: 150 },
  description: { type: String, trim: true, maxlength: 500, default: "" },

  // Exactly one of these two populated — enforced in the future
  // learningPath.validator.js via Joi .xor(), same discipline
  // resource.validator.js uses for file vs externalUrl.
  resourceId: { type: mongoose.Schema.Types.ObjectId, ref: "LearningResource", default: null },
  externalUrl: { type: String, trim: true, default: "" },

  // What this ONE step teaches — narrower than the path's overall
  // skills[] (a path teaches many skills across all its steps; a step
  // teaches one or two). Read by future Recommendation Engine matching
  // the same way Job.requiredSkills would be, per the brainstorm doc's
  // skill-gap example.
  skillTags: { type: [{ type: String, trim: true, lowercase: true }], default: [] },

  estimatedTimeMinutes: { type: Number, min: 0, default: null }
}, { _id: true }); // _id kept (unlike most sub-schemas here) — a student's
                    // future per-step completion record needs a stable
                    // stepId to reference, which a Mongoose sub-document
                    // gets automatically.

const learningPathSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },

    // Drawn from Job.js's OWN enum — see file header. Not a free-text
    // field (unlike Subject.department), because career tracks ARE a
    // fixed, small, cross-referenced set here, unlike departments which
    // vary per-college and have no other module to stay in sync with.
    careerTrack: { type: String, enum: JOB_CATEGORIES, required: true, index: true },

    level: { type: String, enum: DIFFICULTY_VALUES, default: "beginner" },

    // Path-wide skill list — union of what all steps teach, kept as its
    // own field (not derived live from steps[] on every read) so a
    // "browse paths by skill" list query never needs to unwind the
    // steps array. Service layer keeps this in sync with steps[] on
    // create/update, same denormalization discipline as
    // LearningResource.department/semester being copied from Subject.
    skills: { type: [{ type: String, trim: true, lowercase: true }], default: [], index: true },

    // AI-ready metadata — same "reserve early" pattern
    // LearningResource.js's tags/difficulty/estimatedTimeMinutes fields
    // already follow, so no migration is needed once Recommendation
    // integration (Phase 3, already flagged as pending) actually reads
    // these.
    prerequisites: { type: [{ type: String, trim: true, lowercase: true }], default: [] },
    outcomeSkills: { type: [{ type: String, trim: true, lowercase: true }], default: [] },

    steps: {
      type: [pathStepSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: "A learning path cannot have more than 30 steps"
      }
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Reserved, not yet acted on anywhere (no service reads this yet) —
    // same "store the field now, wire the behavior later" approach
    // LearningResource.js already took with tags/difficulty in Phase 1.
    // When a future AI-path-builder ships, it sets this true on create
    // instead of a new migration adding the field retroactively.
    isSystemGenerated: { type: Boolean, default: false },

    status: { type: String, enum: PATH_STATUS_VALUES, default: PATH_STATUS.DRAFT, index: true },

    // Denormalized counter — same pattern Subject.resourceCount/
    // Community.memberCount already use. Incremented by a future
    // learningPath.service.js's enrollInPath(), not by this file.
    enrolledCount: { type: Number, default: 0, min: 0 },

    isArchived: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, versionKey: false }
);

// "Browse paths for my career track" — the single most common read,
// matches careerTrack + status together (student never wants DRAFT
// paths). Same reasoning LearningResource.js's
// { status, department, semester } compound index exists for its own
// most common query shape.
learningPathSchema.index({ careerTrack: 1, status: 1, createdAt: -1 });
// "Browse paths that teach skill X" — skills is already indexed above
// individually; this compound version supports the common
// "skill X, published only" combination without a second full index.
learningPathSchema.index({ skills: 1, status: 1 });
// "My created paths" — Faculty/Admin dashboard, mirrors
// job.service.js's getMyJobs()/Subject.js's { facultyId } pattern.
learningPathSchema.index({ createdBy: 1, isArchived: 1 });

learningPathSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("LearningPath", learningPathSchema);
module.exports.PATH_STATUS = PATH_STATUS;
module.exports.PATH_STATUS_VALUES = PATH_STATUS_VALUES;