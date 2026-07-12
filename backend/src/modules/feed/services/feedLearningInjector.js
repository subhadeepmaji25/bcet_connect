// backend/src/modules/feed/services/feedLearningInjector.js
//
// PHASE 3: same pull-pattern feedCommunityInjector.js/
// feedRecommendationInjector.js already established — Feed reads
// Learning, Learning never pushes into Feed, no new event-bus.
//
// FIX (Phase 1b): this file's visibility query duplicated
// resource.service.js's listResourcesForStudent() query — including
// the same top-level `department` bug (PUBLIC silently department-
// locked). Fixed the same way, in both places, so Feed and the
// Resources list endpoint never disagree about what "public" means.
// Still intentionally duplicated rather than imported — see original
// reasoning below (lightweight card vs full paginated resource).

const Profile = require("../../users/models/Profile");
const LearningResource = require("../../learning/models/LearningResource");
const { RESOURCE_STATUS, VISIBILITY } = require("../../learning/constants/resource.constants");
const logger = require("../../../shared/logger/logger");

const MAX_RESOURCE_CARDS = 2;      // never more than this many synthetic cards per page — same cap Jobs/Community injectors use
const INSERT_AFTER_EVERY = 6;      // spaced further apart than Community (4) — Learning uploads are lower-frequency than posts
const RESOURCE_POOL_SCAN_LIMIT = 50;
const RECENCY_WINDOW_HOURS = 72;   // only surface uploads from the last 3 days — an old resource resurfacing in Feed would feel stale

const toResourceCard = (resource) => ({
  isLearningResource: true,
  recommendationType: "learning_resource",
  _id: `learning_resource_${resource._id}`,
  resourceId: resource._id,
  title: resource.title,
  type: resource.type,
  subject: resource.subjectId ? { _id: resource.subjectId._id, name: resource.subjectId.name, code: resource.subjectId.code } : null,
  uploader: resource.uploaderId,
  difficulty: resource.difficulty,
  createdAt: resource.createdAt
});

// Fails SILENTLY on any error — same discipline
// feedRecommendationInjector.js already follows: this enhances the
// feed, it must never be able to break it.
const injectLearningResources = async (posts, userId) => {
  try {
    const viewerProfile = await Profile.findOne({ userId }).select("department semester section").lean();
    if (!viewerProfile) return posts;

    const since = new Date(Date.now() - RECENCY_WINDOW_HOURS * 60 * 60 * 1000);

    // FIXED (Phase 1b) — department moved INSIDE each $or branch,
    // dropped entirely from PUBLIC, same fix as
    // resource.service.js's listResourcesForStudent().
    const resourcePool = await LearningResource.find({
      status: RESOURCE_STATUS.PUBLISHED,
      isArchived: false,
      createdAt: { $gte: since },
      $or: [
        { visibility: VISIBILITY.PUBLIC },
        { visibility: VISIBILITY.DEPARTMENT, department: viewerProfile.department },
        { visibility: VISIBILITY.SEMESTER, department: viewerProfile.department, semester: viewerProfile.semester },
        { visibility: VISIBILITY.SECTION, department: viewerProfile.department, semester: viewerProfile.semester, section: viewerProfile.section }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(RESOURCE_POOL_SCAN_LIMIT)
      .populate("subjectId", "name code")
      .populate("uploaderId", "username role")
      .lean();

    if (!resourcePool.length) return posts;

    const picked = resourcePool.slice(0, MAX_RESOURCE_CARDS);

    const result = [...posts];
    picked.map(toResourceCard).forEach((card, index) => {
      const insertAt = Math.min((index + 1) * INSERT_AFTER_EVERY, result.length);
      result.splice(insertAt, 0, card);
    });

    return result;
  } catch (err) {
    logger.error(`[feedLearningInjector] Failed to inject learning resources: ${err.message}`);
    return posts;
  }
};

module.exports = { injectLearningResources };