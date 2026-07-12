// backend/src/modules/search/models/LearningSearchDocument.js
//
// NEW MODULE — Search (Phase 3, closes "Search me Learning ka zero
// integration" gap).
//
// WHY A SEPARATE COLLECTION FROM SearchProfile:
// SearchProfile.js is a PEOPLE index — one document per User, rebuilt
// from Profile/Skill/Education/Experience/Project/Resume. Learning
// content (LearningResource, LearningPath) is not a person and has a
// completely different shape (department/semester/section scoping,
// resource type, career track) — bolting it onto SearchProfile would
// mean either a giant sparse schema or silently overloading fields
// that already mean something else for people search. Same restraint
// feedLearningInjector.js already documents for NOT importing
// resource.service.js's full listResourcesForStudent(): a different
// consumer needs a different, lighter shape, so it gets its own model
// rather than contorting an existing one.
//
// ONE collection for BOTH resource and path documents (not two
// separate collections) — contentType discriminates. A learner
// searching "express" wants both a Resource titled "Express.js notes"
// and a Path titled "Express Backend Track" in the same result set,
// so they belong in the same queryable index, same reasoning
// SearchProfile keeps student/faculty/alumni/admin in one collection
// with `role` as the discriminator instead of four collections.
//
// SYNC MODEL: pull-then-push-on-write, not a live join. learningSearch.
// service.js's syncResourceSearchDocument()/syncPathSearchDocument()
// upsert ONE doc per (contentType, refId) whenever the source becomes
// PUBLISHED, and delete it the moment the source stops being publicly
// visible (rejected/archived/unpublished). This index therefore only
// ever contains content a search result is allowed to show — no
// runtime visibility re-check needed on every read the way
// SearchProfile still re-checks `visibility` per query, EXCEPT for
// LearningResource's department/semester/section scoping, which IS
// still re-checked at read time in learningSearch.service.js (a
// resource visible to CSE-sem-4 must not surface for an ECE-sem-2
// searcher even though both indexes are PUBLISHED) — this model stores
// the scoping fields precisely so that read-time check is possible.

const mongoose = require("mongoose");
const { RESOURCE_TYPE_VALUES, VISIBILITY_VALUES, DIFFICULTY_VALUES } = require("../../learning/constants/resource.constants");

const LEARNING_CONTENT_TYPE = Object.freeze({
  RESOURCE: "resource",
  PATH: "path"
});
const LEARNING_CONTENT_TYPE_VALUES = Object.freeze(Object.values(LEARNING_CONTENT_TYPE));

const lowercaseStringArray = () => [{ type: String, lowercase: true, trim: true }];

const learningSearchDocumentSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: LEARNING_CONTENT_TYPE_VALUES, required: true, index: true },

    // Points back at the LearningResource or LearningPath this document
    // was built from — refPath keeps it a real, populate-able reference
    // rather than a bare untyped ObjectId, same discipline
    // LearningPath.js's pathStepSchema.resourceId already follows.
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "refModel"
    },
    refModel: {
      type: String,
      required: true,
      enum: ["LearningResource", "LearningPath"]
    },

    title: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },

    // ── Resource-only fields (blank/null when contentType === "path") ──
    resourceType: { type: String, enum: [...RESOURCE_TYPE_VALUES, null], default: null },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    subjectName: { type: String, trim: true, default: "" },
    subjectCode: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "", index: true },
    semester: { type: Number, default: null, index: true },
    section: { type: String, trim: true, uppercase: true, default: "" },
    // Deliberately kept even though only PUBLISHED docs are ever
    // indexed (see file header) — VISIBILITY.PUBLIC resources have no
    // department/semester/section scoping at read time, so
    // learningSearch.service.js needs this to decide whether to skip
    // the scoping check entirely, same PUBLIC-is-college-wide rule
    // resource.service.js's listResourcesForStudent() already enforces.
    visibility: { type: String, enum: [...VISIBILITY_VALUES, null], default: null },

    // ── Path-only fields (blank/null when contentType === "resource") ──
    careerTrack: { type: String, trim: true, default: "", index: true },
    level: { type: String, enum: [...DIFFICULTY_VALUES, null], default: null },

    // ── Shared fields ──
    tags: lowercaseStringArray(),
    skills: lowercaseStringArray(),
    difficulty: { type: String, enum: [...DIFFICULTY_VALUES, null], default: null },

    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    creatorName: { type: String, trim: true, default: "" },
    creatorRole: { type: String, trim: true, default: "" },

    // Tokenized keyword bag — same normalize+tokenize approach
    // engines/search-profile/buildSearchProfile.js already uses for
    // SearchProfile.searchKeywords, reused here so both indexes are
    // queried with the identical buildRegex()-over-searchKeywords
    // pattern search.service.js already established, instead of this
    // file inventing a second, inconsistent search strategy (e.g.
    // Mongo $text) that the rest of the module doesn't use.
    searchKeywords: lowercaseStringArray(),

    // Lightweight ranking signal — NOT a full recommendation-engine
    // score. Resource: viewCount + downloadCount*2 + ratingAverage*10.
    // Path: enrolledCount*3. Computed once at sync time in
    // learningSearch.service.js, not on every read, same "denormalize
    // the expensive part" reasoning SearchProfile.searchScore already
    // follows relative to calculateSearchScore.js.
    popularityScore: { type: Number, default: 0 },

    generatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// One search document per source record — re-syncing an already-
// indexed resource/path must overwrite, never duplicate.
learningSearchDocumentSchema.index({ contentType: 1, refId: 1 }, { unique: true });

// "Browse resources for my department/semester" — mirrors
// LearningResource.js's own { status, department, semester } index,
// since that's the exact read pattern this collection re-implements
// for the search surface.
learningSearchDocumentSchema.index({ contentType: 1, department: 1, semester: 1, popularityScore: -1 });
// "Browse paths for my career track" — mirrors LearningPath.js's own
// { careerTrack, status } index for the same reason.
learningSearchDocumentSchema.index({ contentType: 1, careerTrack: 1, popularityScore: -1 });
learningSearchDocumentSchema.index({ searchKeywords: 1 });
learningSearchDocumentSchema.index({ tags: 1 });
learningSearchDocumentSchema.index({ skills: 1 });
learningSearchDocumentSchema.index({ subjectId: 1 });

const LearningSearchDocument = mongoose.model("LearningSearchDocument", learningSearchDocumentSchema);

module.exports = LearningSearchDocument;
module.exports.LEARNING_CONTENT_TYPE = LEARNING_CONTENT_TYPE;
module.exports.LEARNING_CONTENT_TYPE_VALUES = LEARNING_CONTENT_TYPE_VALUES;