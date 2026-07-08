// backend/src/modules/recommendation/services/recommendation.service.js

const SearchProfile = require("../../search/models/SearchProfile");
const Education = require("../../users/models/Education");
const Experience = require("../../users/models/Experience");
const Job = require("../../jobs/models/Job");
const ApiError = require("../../../shared/errors/ApiError");

const { calculateJobMatch } = require("./matchScore.service");
const { rankAndPaginate } = require("./ranking.service");
const {
  RECOMMENDATION_MIN_SCORE,
  RECOMMENDATION_SCAN_LIMIT,
  MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION
} = require("../constants/scoreWeights");
const SAFE_SCAN_LIMIT = Number(RECOMMENDATION_SCAN_LIMIT) > 0 ? Number(RECOMMENDATION_SCAN_LIMIT) : 300;

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
const loadCandidateContext = async (userId) => {
  const [searchProfile, educationList, experienceList] = await Promise.all([
    SearchProfile.findOne({ userId }).lean(),
    Education.find({ userId }).select("cgpa branch endYear startYear current").lean(),
    Experience.find({ userId }).select("startDate endDate currentlyWorking").lean()
  ]);

  if (!searchProfile) {
    throw ApiError.notFound(
      "Search profile not found. Complete your profile first so recommendations can be generated."
    );
  }

  const latestEducation = pickLatestEducation(educationList);
  const experienceMonths = calculateTotalExperienceMonths(experienceList);

  return {
    userId,
    role: searchProfile.role,
    branch: searchProfile.branch || latestEducation?.branch || "",
    passoutYear: searchProfile.passoutYear,
    cgpa: latestEducation?.cgpa ?? null,
    // Backlog abhi kahin track nahi hota (Education model me field hi nahi hai).
    // eligibility.service.js isko null dekh kar "benefit of doubt" deta hai.
    backlogCount: null,
    mergedSkills: searchProfile.mergedSkills || [],
    resumeSkills: searchProfile.resumeSkills || [],
    projectSkills: searchProfile.projectSkills || [],
    experienceMonths,
    profileCompletion: searchProfile.profileCompletion || 0,
    recommendationEnabled: Boolean(searchProfile.recommendationEnabled)
  };
};

const loadCandidateJobPool = async () => {
  return Job.find({
    status: "approved",
    isDeleted: false,
    isArchived: false,
    $or: [{ deadline: null }, { deadline: { $gte: new Date() } }]
  })
    .sort({ "metadata.featured": -1, "metadata.priority": -1, createdAt: -1 })
    .limit(SAFE_SCAN_LIMIT)
    .lean();
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

  const jobPool = await loadCandidateJobPool();

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
      scannedJobs: jobPool.length
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