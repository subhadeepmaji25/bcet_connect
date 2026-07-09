// backend/src/modules/feed/services/feedRecommendationInjector.js
//
// PHASE 3: takes an already-ranked page of real FeedPosts and
// interleaves "suggested job" cards, reusing the EXISTING Recommendation
// Engine (matchScore.service.js) — Feed does not own any matching logic.
// If Recommendation's rules change, this file needs zero changes.
//
// Scoped to JOBS only. Recommendation only knows how to score Jobs
// today — "Suggested Community" / "Suggested Mentor" need their own
// scoring functions built in the Recommendation module FIRST; wire
// those in the same way once they exist, don't build ad-hoc scoring
// logic here just because Feed wants it.

const SearchProfile = require("../../search/models/SearchProfile");
const Job = require("../../jobs/models/Job");
const { calculateJobMatch } = require("../../recommendation/services/matchScore.service");
const {
  RECOMMENDATION_MIN_SCORE,
  MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION
} = require("../../recommendation/constants/scoreWeights");
const { FEED_INJECTION } = require("../constants/feed.constants");
const logger = require("../../../shared/logger/logger");

const loadJobPool = async () => {
  return Job.find({ status: "approved", isDeleted: false, isArchived: false })
    .sort({ createdAt: -1 })
    .limit(FEED_INJECTION.JOB_POOL_SCAN_LIMIT)
    .lean();
};

// Minimal shape matchScore.service.js needs — recommendation.service.js's
// full loadCandidateContext() isn't exported, and importing half a
// module's internals is worse than these 6 fields duplicated here.
const buildLightCandidateContext = (searchProfile) => ({
  role: searchProfile.role || "",
  mergedSkills: searchProfile.mergedSkills || [],
  resumeSkills: searchProfile.resumeSkills || [],
  projectSkills: searchProfile.projectSkills || [],
  experienceMonths: 0,
  cgpa: null,
  branch: searchProfile.branch || ""
});

const toSuggestionCard = (job, match) => ({
  isRecommendation: true,     // frontend renders this as a distinct card style
  recommendationType: "job",
  _id: `rec_job_${job._id}`,  // synthetic — never collides with a real FeedPost ObjectId
  job: { _id: job._id, title: job.title, company: job.company, location: job.location },
  matchScore: match.finalScore,
  matchLabel: match.matchLabel,
  createdAt: new Date() // read-time card, not stored — always "fresh"
});

// Interleaves up to FEED_INJECTION.MAX_PER_PAGE suggestion cards,
// spaced FEED_INJECTION.INTERVAL posts apart. Fails SILENTLY on any
// error — recommendation injection enhances the feed, it must never
// be able to break it.
const injectRecommendations = async (posts, userId) => {
  try {
    const searchProfile = await SearchProfile.findOne({ userId }).lean();
    if (!searchProfile) return posts;
    if ((searchProfile.profileCompletion || 0) < MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION) return posts;
    if (!searchProfile.recommendationEnabled) return posts;

    const jobPool = await loadJobPool();
    if (!jobPool.length) return posts;

    const candidateContext = buildLightCandidateContext(searchProfile);

    const scored = jobPool
      .map((job) => ({ job, match: calculateJobMatch(candidateContext, job) }))
      .filter((entry) => entry.match.eligible && entry.match.finalScore >= RECOMMENDATION_MIN_SCORE)
      .sort((a, b) => b.match.finalScore - a.match.finalScore)
      .slice(0, FEED_INJECTION.MAX_PER_PAGE);

    if (!scored.length) return posts;

    const result = [...posts];
    scored.forEach((entry, index) => {
      const insertAt = Math.min((index + 1) * FEED_INJECTION.INTERVAL, result.length);
      result.splice(insertAt, 0, toSuggestionCard(entry.job, entry.match));
    });

    return result;
  } catch (err) {
    logger.error(`[feedRecommendationInjector] Failed to inject recommendations: ${err.message}`);
    return posts;
  }
};

module.exports = { injectRecommendations };
