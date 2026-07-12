// backend/src/modules/recommendation/services/recommendation.service.js
//
// PHASE 3 UPDATE: loadCandidateContext() now also reads LearningProgress
// (completed resources) — Recommendation READS Learning, same
// pull-only discipline this module already keeps toward SearchProfile/
// Education/Experience. Recommendation never writes to Learning, never
// controls it — exact same boundary the brainstorm doc asked for
// ("Learning Recommendation Engine ko consume karega, Recommendation
// Learning ko control nahi karega").
//
// NOTE ON FIELD NAME: LearningResource currently stores topic/skill
// words in a single `tags` field (the skills[]/topics[] split flagged
// as Phase 2 hasn't been applied yet). completedSkills below reads
// from `tags` for that reason — once Phase 2 ships (skills[]/topics[]
// split on LearningResource), swap the populate/select below from
// `tags` to `skills` with a one-line change here, nothing else in this
// file needs to move.

const SearchProfile = require("../../search/models/SearchProfile");
const Education = require("../../users/models/Education");
const Experience = require("../../users/models/Experience");
const Job = require("../../jobs/models/Job");
const LearningProgress = require("../../learning/models/LearningProgress");
const { canUserAccessJob } = require("../../jobs/services/job.service");
const Profile = require("../../users/models/Profile");
const ApiError = require("../../../shared/errors/ApiError");

const { calculateJobMatch } = require("./matchScore.service");
const { rankAndPaginate } = require("./ranking.service");
const {
  RECOMMENDATION_MIN_SCORE,
  RECOMMENDATION_SCAN_LIMIT,
  MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION
} = require("../constants/scoreWeights");
const SAFE_SCAN_LIMIT = Number(RECOMMENDATION_SCAN_LIMIT) > 0 ? Number(RECOMMENDATION_SCAN_LIMIT) : 300;

// Cap on how many completed resources are read per candidate — same
// "cheap, not exhaustive" reasoning RECOMMENDATION_SCAN_LIMIT already
// applies to the Job pool scan below; a candidate's completed-topics
// signal doesn't need every historical row, just a representative
// recent sample.
const LEARNING_PROGRESS_SCAN_LIMIT = 100;

const pickLatestEducation = (educationList = []) => {
  if (!educationList.length) return null;

  const yearOf = (item) => (item.current ? 9999 : Number(item.endYear || item.startYear || 0));

  return educationList.slice().sort((a, b) => yearOf(b) - yearOf(a))[0];
};

const calculateMonthsBetween = (startDate, endDate, currentlyWorking) => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = currentlyWorking ? new Date() : endDate ? new Date(endDate) : null;
  if (!end) return 0;

  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(months, 0);
};

const calculateTotalExperienceMonths = (experienceList = []) => {
  return experienceList.reduce(
    (total, item) => total + calculateMonthsBetween(item.startDate, item.endDate, item.currentlyWorking),
    0
  );
};

// Reads ONLY completed LearningProgress rows, populates each
// resource's `tags` — flattens + dedupes into one skill list. Wrapped
// so a Learning-side failure (missing model, bad data) never breaks
// job recommendations, which existed and worked long before Learning
// did — same defensive stance calculateMatchScoreForApplication()
// below already takes toward the WHOLE candidate context.
const loadCompletedLearningSkills = async (userId) => {
  try {
    const completedRows = await LearningProgress.find({ userId, status: "completed" })
      .select("resourceId")
      .sort({ updatedAt: -1 })
      .limit(LEARNING_PROGRESS_SCAN_LIMIT)
      .populate({ path: "resourceId", select: "tags", options: { lean: true } })
      .lean();

    const skillSet = new Set();
    completedRows.forEach((row) => {
      (row.resourceId?.tags || []).forEach((tag) => skillSet.add(tag));
    });

    return Array.from(skillSet);
  } catch (err) {
    // Silent fallback — see file header. A Learning-side read failure
    // must degrade to "no completed-topics signal", never throw and
    // block job recommendations entirely.
    return [];
  }
};

const loadCandidateContext = async (userId) => {
  const [searchProfile, educationList, experienceList, completedLearningSkills] = await Promise.all([
    SearchProfile.findOne({ userId }).lean(),
    Education.find({ userId }).select("cgpa branch endYear startYear current").lean(),
    Experience.find({ userId }).select("startDate endDate currentlyWorking").lean(),
    loadCompletedLearningSkills(userId)
  ]);

  if (!searchProfile) {
    throw ApiError.notFound(
      "Search profile not found. Complete your profile first so recommendations can be generated."
    );
  }

  const latestEducation = pickLatestEducation(educationList);
  const experienceMonths = calculateTotalExperienceMonths(experienceList);

  // mergedSkills now folds in completed-learning skills too — this is
  // the ONE line that actually wires "Learning + Jobs" skill-gap
  // matching the brainstorm doc asked for: a candidate who completed a
  // "MongoDB" resource but never listed it on their resume/projects
  // will now match jobs requiring MongoDB, without touching
  // matchScore.service.js at all (it only ever reads mergedSkills).
  const mergedSkills = Array.from(new Set([...(searchProfile.mergedSkills || []), ...completedLearningSkills]));

  return {
    userId,
    role: searchProfile.role,
    branch: searchProfile.branch || latestEducation?.branch || "",
    passoutYear: searchProfile.passoutYear,
    cgpa: latestEducation?.cgpa ?? null,
    // Backlog abhi kahin track nahi hota (Education model me field hi nahi hai).
    // eligibility.service.js isko null dekh kar "benefit of doubt" deta hai.
    backlogCount: null,
    mergedSkills,
    resumeSkills: searchProfile.resumeSkills || [],
    projectSkills: searchProfile.projectSkills || [],
    // Exposed separately too (not just folded into mergedSkills) — so
    // a future UI can show "these X skills came from Learning" as its
    // own breakdown, without re-deriving the LearningProgress query.
    completedLearningSkills,
    experienceMonths,
    profileCompletion: searchProfile.profileCompletion || 0,
    recommendationEnabled: Boolean(searchProfile.recommendationEnabled)
  };
};

const loadCandidateJobPool = async (userId, userRole) => {
  const viewerProfile = await Profile.findOne({ userId }).select("branch department").lean();
  const jobs = await Job.find({
    status: "approved",
    isDeleted: false,
    isArchived: false,
    $or: [{ deadline: null }, { deadline: { $gte: new Date() } }]
  })
    .sort({ "metadata.featured": -1, "metadata.priority": -1, createdAt: -1 })
    .limit(SAFE_SCAN_LIMIT)
    .lean();
  const visibleJobs = [];
  for (const job of jobs) {
    if (await canUserAccessJob(job, userId, userRole, viewerProfile)) {
      visibleJobs.push(job);
    }
  }
  return visibleJobs;
};

const getRecommendedJobs = async (userId, { page = 1, limit = 10, minScore = RECOMMENDATION_MIN_SCORE } = {}) => {
  const candidate = await loadCandidateContext(userId);

  if (!candidate.recommendationEnabled || candidate.profileCompletion < MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION) {
    return {
      jobs: [],
      pagination: { total: 0, page: 1, limit: Number(limit), totalPages: 1 },
      meta: {
        recommendationsEnabled: false,
        profileCompletion: candidate.profileCompletion,
        requiredCompletion: MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION,
        message: `Complete at least ${MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION}% of your profile to unlock job recommendations.`
      }
    };
  }

  const jobPool = await loadCandidateJobPool(userId, candidate.role);

  const scoredJobs = jobPool.map((job) => ({
    job,
    match: calculateJobMatch(candidate, job)
  }));

  const { items, pagination } = rankAndPaginate(scoredJobs, { minScore, eligibleOnly: true, page, limit });

  const jobs = items.map(({ job, match }) => ({
    ...job,
    matchScore: match.finalScore,
    matchLabel: match.matchLabel,
    categoryScores: match.categoryScores,
    skillBreakdown: match.skillBreakdown
  }));

  return {
    jobs,
    pagination,
    meta: {
      recommendationsEnabled: true,
      profileCompletion: candidate.profileCompletion,
      scannedJobs: jobPool.length,
      completedLearningSkillsCount: candidate.completedLearningSkills.length
    }
  };
};

const getJobMatchForCandidate = async (userId, jobId) => {
  const [candidate, job] = await Promise.all([
    loadCandidateContext(userId),
    Job.findOne({ _id: jobId, isDeleted: false }).lean()
  ]);

  if (!job) {
    throw ApiError.notFound("Job not found");
  }

  return {
    job,
    candidate,
    match: calculateJobMatch(candidate, job)
  };
};

const calculateMatchScoreForApplication = async (userId, job) => {
  try {
    const candidate = await loadCandidateContext(userId);
    const match = calculateJobMatch(candidate, job);
    return match.finalScore;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  loadCandidateContext,
  loadCandidateJobPool,
  getRecommendedJobs,
  getJobMatchForCandidate,
  calculateMatchScoreForApplication
};
