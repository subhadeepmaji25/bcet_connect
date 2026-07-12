// backend/src/modules/search/services/learningSearch.service.js
//
// NEW MODULE — Search (Phase 3).
//
// Two responsibilities, deliberately kept in one file (not split into
// a sync-service + read-service) because they share the same model and
// same normalization helpers, and neither half is large enough on its
// own to justify a second file — same "don't split preemptively"
// restraint LearningPath.js's file header already applies to itself:
//
//   1. SYNC  — syncResourceSearchDocument() / syncPathSearchDocument() /
//      removeResourceSearchDocument() / removePathSearchDocument().
//      Called from resource.service.js and learningPath.service.js
//      at the exact moments a resource/path's public visibility
//      changes (published, rejected, archived). Pull-pattern, same as
//      feedLearningInjector.js: this file reads FROM Learning, Learning
//      never pushes INTO Search, no new event-bus.
//
//   2. READ  — searchLearningContent() / searchLearningSuggestions().
//      Consumed by search.service.js's new searchAll() (see that
//      file), and available standalone for a future dedicated
//      /search/learning route.
//
// FAILS SILENTLY on the sync side — same non-negotiable discipline
// feedLearningInjector.js documents for itself: a search-index write
// failure must NEVER break the resource upload/verify/delete or path
// publish/update/archive flow that triggered it. The read side throws
// normally (ApiError), same as every other search.service.js function,
// since a broken read genuinely should surface to the caller.

const LearningSearchDocument = require("../models/LearningSearchDocument");
const { LEARNING_CONTENT_TYPE } = LearningSearchDocument;
const LearningResource = require("../../learning/models/LearningResource");
const LearningPath = require("../../learning/models/LearningPath");
const Profile = require("../../users/models/Profile");
const { RESOURCE_STATUS, VISIBILITY } = require("../../learning/constants/resource.constants");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

// ── Normalization helpers ───────────────────────────────────────────
// Same normalize+tokenize shape engines/search-profile/buildSearchProfile.js
// already uses for SearchProfile.searchKeywords — kept as a local copy
// rather than a shared import. That engine lives under engines/, is
// wired specifically to People-search field extraction (Skill/Education/
// Experience documents), and importing it here would drag that
// unrelated dependency graph into the Learning module for the sake of
// one small helper. Promote to a shared util only if a third consumer
// ever needs it, same restraint subjectDiscussion.service.js already
// documents for its own getUsernameSafe() copy.
const normalizeKeyword = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\s+/g, " ").trim().toLowerCase();
};

const tokenizeText = (value) => {
  const normalized = normalizeKeyword(value);
  if (!normalized) return [];
  return normalized
    .split(/[^a-z0-9+#.]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && token.length <= 40);
};

const normalizeKeywordList = (values = []) => {
  const flat = values.flatMap((v) => (Array.isArray(v) ? v : [v])).map(normalizeKeyword).filter(Boolean);
  return [...new Set(flat)];
};

const buildSearchKeywords = (fields = []) => {
  const base = normalizeKeywordList(fields);
  return normalizeKeywordList([...base, ...base.flatMap(tokenizeText)]);
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const buildRegex = (value) => new RegExp(escapeRegex(String(value).trim()), "i");

const buildPagination = ({ page = 1, limit = 10 } = {}) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 10, 1);
  return { page: normalizedPage, limit: normalizedLimit, skip: (normalizedPage - 1) * normalizedLimit };
};

// ═══════════════════════════════════════════════════════════════════
// SYNC — write side
// ═══════════════════════════════════════════════════════════════════

// Only a PUBLISHED, non-archived resource is ever indexed — pending/
// rejected/archived resources are removed from the index instead (see
// removeResourceSearchDocument), same "the index only ever contains
// what a search result is allowed to show" invariant LearningSearchDocument.
// js's file header documents.
const syncResourceSearchDocument = async (resourceId) => {
  try {
    const resource = await LearningResource.findOne({ _id: resourceId, isArchived: false })
      .populate("subjectId", "name code")
      .populate("uploaderId", "username fullName role")
      .lean();

    if (!resource || resource.status !== RESOURCE_STATUS.PUBLISHED) {
      // Not (or no longer) publicly visible — make sure any stale
      // index entry from a previous published state is gone too.
      await removeResourceSearchDocument(resourceId);
      return;
    }

    const popularityScore =
      (resource.viewCount || 0) + (resource.downloadCount || 0) * 2 + (resource.ratingAverage || 0) * 10;

    const searchKeywords = buildSearchKeywords([
      resource.title,
      resource.description,
      resource.subjectId?.name,
      resource.subjectId?.code,
      resource.department,
      ...(resource.tags || [])
    ]);

    await LearningSearchDocument.findOneAndUpdate(
      { contentType: LEARNING_CONTENT_TYPE.RESOURCE, refId: resource._id },
      {
        contentType: LEARNING_CONTENT_TYPE.RESOURCE,
        refId: resource._id,
        refModel: "LearningResource",
        title: resource.title,
        description: resource.description || "",
        resourceType: resource.type,
        subjectId: resource.subjectId?._id || null,
        subjectName: resource.subjectId?.name || "",
        subjectCode: resource.subjectId?.code || "",
        department: resource.department,
        semester: resource.semester,
        section: resource.section || "",
        visibility: resource.visibility,
        careerTrack: "",
        level: null,
        tags: resource.tags || [],
        skills: [],
        difficulty: resource.difficulty || null,
        creatorId: resource.uploaderId?._id || resource.uploaderId,
        creatorName: resource.uploaderId?.fullName || resource.uploaderId?.username || "",
        creatorRole: resource.uploaderRole,
        searchKeywords,
        popularityScore,
        generatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    // Never let an index-sync failure bubble up into the caller's
    // upload/verify/delete flow — same discipline
    // feedLearningInjector.js's injectLearningResources() follows.
    logger.error(`[learningSearch] Failed to sync resource ${resourceId}: ${err.message}`, err);
  }
};

const removeResourceSearchDocument = async (resourceId) => {
  try {
    await LearningSearchDocument.deleteOne({ contentType: LEARNING_CONTENT_TYPE.RESOURCE, refId: resourceId });
  } catch (err) {
    logger.error(`[learningSearch] Failed to remove resource ${resourceId} from index: ${err.message}`, err);
  }
};

// Only a PUBLISHED, non-archived path is ever indexed — DRAFT paths
// are invisible to students anyway (learningPath.service.js's
// listPaths() already filters to PUBLISHED only), so indexing a DRAFT
// would let search leak content the browse endpoint itself hides.
const syncPathSearchDocument = async (pathId) => {
  try {
    const path = await LearningPath.findOne({ _id: pathId, isArchived: false })
      .populate("createdBy", "username fullName role")
      .lean();

    if (!path || path.status !== LearningPath.PATH_STATUS.PUBLISHED) {
      await removePathSearchDocument(pathId);
      return;
    }

    const popularityScore = (path.enrolledCount || 0) * 3;

    const searchKeywords = buildSearchKeywords([
      path.title,
      path.description,
      path.careerTrack,
      ...(path.skills || []),
      ...(path.outcomeSkills || [])
    ]);

    await LearningSearchDocument.findOneAndUpdate(
      { contentType: LEARNING_CONTENT_TYPE.PATH, refId: path._id },
      {
        contentType: LEARNING_CONTENT_TYPE.PATH,
        refId: path._id,
        refModel: "LearningPath",
        title: path.title,
        description: path.description || "",
        resourceType: null,
        subjectId: null,
        subjectName: "",
        subjectCode: "",
        department: "",
        semester: null,
        section: "",
        visibility: null,
        careerTrack: path.careerTrack,
        level: path.level || null,
        tags: [],
        skills: path.skills || [],
        difficulty: path.level || null,
        creatorId: path.createdBy?._id || path.createdBy,
        creatorName: path.createdBy?.fullName || path.createdBy?.username || "",
        creatorRole: path.createdBy?.role || "",
        searchKeywords,
        popularityScore,
        generatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    logger.error(`[learningSearch] Failed to sync path ${pathId}: ${err.message}`, err);
  }
};

const removePathSearchDocument = async (pathId) => {
  try {
    await LearningSearchDocument.deleteOne({ contentType: LEARNING_CONTENT_TYPE.PATH, refId: pathId });
  } catch (err) {
    logger.error(`[learningSearch] Failed to remove path ${pathId} from index: ${err.message}`, err);
  }
};

// ═══════════════════════════════════════════════════════════════════
// READ — query side
// ═══════════════════════════════════════════════════════════════════

// Resource-type index docs still carry department/semester/section/
// visibility scoping (see LearningSearchDocument.js file header) — a
// student searching must never see a DEPARTMENT/SEMESTER/SECTION
// resource outside their own scope just because it matched a keyword.
// Path-type docs and PUBLIC-visibility resource docs have no such
// scoping. Faculty/Admin bypass scoping entirely — same "staff sees
// everything published" rule resource.service.js's
// listResourcesForStaff() already applies for the non-search browse.
const buildVisibilityOr = (viewerProfile) => [
  { contentType: LEARNING_CONTENT_TYPE.PATH },
  { contentType: LEARNING_CONTENT_TYPE.RESOURCE, visibility: VISIBILITY.PUBLIC },
  { contentType: LEARNING_CONTENT_TYPE.RESOURCE, visibility: VISIBILITY.DEPARTMENT, department: viewerProfile.department },
  {
    contentType: LEARNING_CONTENT_TYPE.RESOURCE,
    visibility: VISIBILITY.SEMESTER,
    department: viewerProfile.department,
    semester: viewerProfile.semester
  },
  {
    contentType: LEARNING_CONTENT_TYPE.RESOURCE,
    visibility: VISIBILITY.SECTION,
    department: viewerProfile.department,
    semester: viewerProfile.semester,
    section: viewerProfile.section
  }
];

const searchLearningContent = async (filters = {}, viewerId = null, viewerRole = null) => {
  const { q, contentType, careerTrack, department, semester, type, difficulty, skill, tag } = filters;
  const { page, limit, skip } = buildPagination(filters);

  const andConditions = [];

  if (contentType) andConditions.push({ contentType });

  const isStaff = viewerRole === "faculty" || viewerRole === "admin";
  if (!isStaff) {
    if (!viewerId) throw ApiError.badRequest("A viewer is required to search learning content");
    const viewerProfile = await Profile.findOne({ userId: viewerId }).select("department semester section").lean();
    if (!viewerProfile) throw ApiError.notFound("Profile not found");
    andConditions.push({ $or: buildVisibilityOr(viewerProfile) });
  }

  if (careerTrack) andConditions.push({ careerTrack });
  if (department) andConditions.push({ department });
  if (semester) andConditions.push({ semester: Number(semester) });
  if (type) andConditions.push({ resourceType: type });
  if (difficulty) andConditions.push({ difficulty });
  if (skill) andConditions.push({ skills: buildRegex(skill) });
  if (tag) andConditions.push({ tags: buildRegex(tag) });

  if (q) {
    const keywordRegex = buildRegex(q);
    andConditions.push({
      $or: [
        { searchKeywords: keywordRegex },
        { title: keywordRegex },
        { description: keywordRegex },
        { subjectName: keywordRegex },
        { subjectCode: keywordRegex },
        { skills: keywordRegex },
        { tags: keywordRegex }
      ]
    });
  }

  const query = andConditions.length === 0 ? {} : andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  const [results, total] = await Promise.all([
    LearningSearchDocument.find(query)
      .sort({ popularityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LearningSearchDocument.countDocuments(query)
  ]);

  return {
    results,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// Lightweight autocomplete — mirrors search.service.js's
// searchSuggestions() shape (small field projection, limit 10, no
// pagination metadata) so the two can be merged client-side into one
// combined suggestions dropdown without the frontend needing two
// different response shapes.
const searchLearningSuggestions = async (keyword, viewerId = null, viewerRole = null) => {
  if (!keyword) return [];

  const andConditions = [];
  const isStaff = viewerRole === "faculty" || viewerRole === "admin";
  if (!isStaff) {
    if (!viewerId) return [];
    const viewerProfile = await Profile.findOne({ userId: viewerId }).select("department semester section").lean();
    if (!viewerProfile) return [];
    andConditions.push({ $or: buildVisibilityOr(viewerProfile) });
  }

  const keywordRegex = buildRegex(keyword);
  andConditions.push({
    $or: [{ searchKeywords: keywordRegex }, { title: keywordRegex }, { subjectName: keywordRegex }]
  });

  const query = andConditions.length === 1 ? andConditions[0] : { $and: andConditions };

  return LearningSearchDocument.find(query)
    .select("contentType refId title resourceType careerTrack subjectName popularityScore")
    .sort({ popularityScore: -1 })
    .limit(10)
    .lean();
};

module.exports = {
  syncResourceSearchDocument,
  removeResourceSearchDocument,
  syncPathSearchDocument,
  removePathSearchDocument,
  searchLearningContent,
  searchLearningSuggestions
};