// backend/src/modules/search/services/search.service.js
const SearchProfile = require("../models/SearchProfile");
const connectionService = require("../../connections/services/connection.service");
const ApiError = require("../../../shared/errors/ApiError");

const TOP_USERS_SELECT =
  "userId username fullName role visibility avatar headline branch department currentCompany currentRole location passoutYear isMentor mentorProfileVisibility mergedSkills verifiedSkills companies profileCompletion recommendationEnabled searchScore lastActiveAt";

const SUGGESTIONS_SELECT =
  "userId username fullName role visibility avatar headline branch currentCompany currentRole mergedSkills verifiedSkills companies searchScore";

const LIMITED_CARD_FIELDS = ["_id", "userId", "username", "fullName", "role", "avatar"];

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildRegex = (value) => new RegExp(escapeRegex(String(value).trim()), "i");

const toBoolean = (value) => {
  if (typeof value === "boolean") return value;
  return String(value).trim().toLowerCase() === "true";
};

const buildPagination = ({ page = 1, limit = 10 } = {}) => {
  const normalizedPage = Math.max(Number(page) || 1, 1);
  const normalizedLimit = Math.max(Number(limit) || 10, 1);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit
  };
};

const buildSearchQuery = (
  {
    q,
    role,
    branch,
    passoutYear,
    company,
    minCompletion,
    recommendationReady,
    isMentor,
    mentorProfileVisibility,
    allowedUserIds
  } = {},
  viewerId = null
) => {
  const andConditions = [];

  if (viewerId) andConditions.push({ userId: { $ne: viewerId } });
  if (allowedUserIds && Array.isArray(allowedUserIds)) {
    andConditions.push({ userId: { $in: allowedUserIds } });
  }
  if (role) andConditions.push({ role });

  if (branch) {
    const branchRegex = buildRegex(branch);
    andConditions.push({
      $or: [
        { branch: branchRegex },
        { "education.branch": branchRegex },
        { educationSkills: branchRegex },
        { searchKeywords: branchRegex }
      ]
    });
  }

  if (passoutYear !== undefined && passoutYear !== null) {
    andConditions.push({ passoutYear: Number(passoutYear) });
  }

  if (company) {
    const companyRegex = buildRegex(company);
    andConditions.push({
      $or: [
        { currentCompany: companyRegex },
        { companies: companyRegex },
        { "experiences.company": companyRegex },
        { searchKeywords: companyRegex }
      ]
    });
  }

  if (minCompletion !== undefined) {
    andConditions.push({ profileCompletion: { $gte: Number(minCompletion) } });
  }

  if (recommendationReady !== undefined) {
    andConditions.push({ recommendationEnabled: toBoolean(recommendationReady) });
  }

  if (isMentor !== undefined) {
    andConditions.push({ isMentor: toBoolean(isMentor) });
  }

  if (mentorProfileVisibility === "public") {
    andConditions.push({
      $or: [
        { mentorProfileVisibility: "public" },
        { mentorProfileVisibility: { $exists: false } }
      ]
    });
  } else if (mentorProfileVisibility) {
    andConditions.push({ mentorProfileVisibility });
  }

  if (q) {
    const keywordRegex = buildRegex(q);
    andConditions.push({
      $or: [
        { searchKeywords: keywordRegex },
        { fullName: keywordRegex },
        { username: keywordRegex },
        { headline: keywordRegex },
        { bio: keywordRegex },
        { currentRole: keywordRegex },
        { currentCompany: keywordRegex },
        { mergedSkills: keywordRegex },
        { verifiedSkills: keywordRegex },
        { advancedSkills: keywordRegex },
        { educationSkills: keywordRegex },
        { projectSkills: keywordRegex },
        { experienceSkills: keywordRegex },
        { resumeSkills: keywordRegex },
        { companies: keywordRegex },
        { branch: keywordRegex },
        { department: keywordRegex },
        { "education.institution": keywordRegex },
        { "education.degree": keywordRegex },
        { "education.branch": keywordRegex },
        { "experiences.company": keywordRegex },
        { "experiences.position": keywordRegex },
        { "projects.title": keywordRegex },
        { "projects.skills": keywordRegex }
      ]
    });
  }

  if (andConditions.length === 0) return {};
  return andConditions.length === 1 ? andConditions[0] : { $and: andConditions };
};

const projectByVisibility = (profile) => {
  if (profile.visibility !== "private") return profile;

  const limited = {};
  for (const field of LIMITED_CARD_FIELDS) {
    if (profile[field] !== undefined) {
      limited[field] = profile[field];
    }
  }

  limited.visibility = "private";
  limited.isLimitedProfile = true;

  return limited;
};

// FIXED: getConnectionStatusesForViewer() returns a Map whose values are
// OBJECTS ({ status, requestId? }), not bare strings. This used to fall
// back to the string "none" while leaving the CONNECTED/PENDING cases as
// raw objects — an inconsistent shape, so a frontend checking
// `connectionStatus === "connected"` would never match. Now every branch
// unwraps to just the status string, so connectionStatus is always one
// of "none" | "pending_sent" | "pending_received" | "connected".
const attachConnectionStatuses = async (profiles, viewerId) => {
  if (!viewerId || profiles.length === 0) return profiles;

  const targetIds = profiles.map((profile) => profile.userId).filter(Boolean);
  const statusMap = await connectionService.getConnectionStatusesForViewer(viewerId, targetIds);

  return profiles.map((profile) => ({
    ...profile,
    connectionStatus: profile.userId
      ? (statusMap.get(profile.userId.toString())?.status || "none")
      : "none"
  }));
};

const finalizeResults = async (profiles, viewerId) => {
  const projected = profiles.map(projectByVisibility);
  return attachConnectionStatuses(projected, viewerId);
};

const searchUsers = async (filters = {}, viewerId = null) => {
  const { page, limit, skip } = buildPagination(filters);
  const query = buildSearchQuery(filters, viewerId);

  const [rawUsers, total] = await Promise.all([
    SearchProfile.find(query)
      .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    SearchProfile.countDocuments(query)
  ]);

  const users = await finalizeResults(rawUsers, viewerId);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const searchBySkill = async (skill, viewerId = null) => {
  if (!skill) throw ApiError.badRequest("Skill is required");

  const skillRegex = buildRegex(skill);
  const query = {
    ...(viewerId ? { userId: { $ne: viewerId } } : {}),
    $or: [
      { mergedSkills: skillRegex },
      { verifiedSkills: skillRegex },
      { advancedSkills: skillRegex },
      { educationSkills: skillRegex },
      { projectSkills: skillRegex },
      { experienceSkills: skillRegex },
      { resumeSkills: skillRegex },
      { searchKeywords: skillRegex }
    ]
  };

  const rawUsers = await SearchProfile.find(query)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(50)
    .lean();

  return finalizeResults(rawUsers, viewerId);
};

const searchByBranch = async (branch, viewerId = null) => {
  if (!branch) throw ApiError.badRequest("Branch is required");

  const branchRegex = buildRegex(branch);
  const query = {
    ...(viewerId ? { userId: { $ne: viewerId } } : {}),
    $or: [
      { branch: branchRegex },
      { "education.branch": branchRegex },
      { educationSkills: branchRegex },
      { searchKeywords: branchRegex }
    ]
  };

  const rawUsers = await SearchProfile.find(query)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(50)
    .lean();

  return finalizeResults(rawUsers, viewerId);
};

const searchByRole = async (role, viewerId = null) => {
  if (!role) throw ApiError.badRequest("Role is required");

  const query = {
    role,
    ...(viewerId ? { userId: { $ne: viewerId } } : {})
  };

  const rawUsers = await SearchProfile.find(query)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(50)
    .lean();

  return finalizeResults(rawUsers, viewerId);
};

const searchByCompany = async (company, viewerId = null) => {
  if (!company) throw ApiError.badRequest("Company is required");

  const companyRegex = buildRegex(company);
  const query = {
    ...(viewerId ? { userId: { $ne: viewerId } } : {}),
    $or: [
      { currentCompany: companyRegex },
      { companies: companyRegex },
      { "experiences.company": companyRegex },
      { searchKeywords: companyRegex }
    ]
  };

  const rawUsers = await SearchProfile.find(query)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(50)
    .lean();

  return finalizeResults(rawUsers, viewerId);
};

const searchSuggestions = async (keyword, viewerId = null) => {
  if (!keyword) return [];

  const keywordRegex = buildRegex(keyword);
  const query = {
    ...(viewerId ? { userId: { $ne: viewerId } } : {}),
    $or: [
      { searchKeywords: keywordRegex },
      { fullName: keywordRegex },
      { username: keywordRegex },
      { headline: keywordRegex },
      { mergedSkills: keywordRegex },
      { companies: keywordRegex },
      { branch: keywordRegex }
    ]
  };

  const rawSuggestions = await SearchProfile.find(query)
    .select(SUGGESTIONS_SELECT)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(10)
    .lean();

  return rawSuggestions.map(projectByVisibility);
};

const getSearchProfileByUserId = async (userId) => SearchProfile.findOne({ userId }).lean();

const getTopUsers = async ({ role, limit = 10 } = {}, viewerId = null) => {
  const query = {};

  if (role) query.role = role;
  if (viewerId) query.userId = { $ne: viewerId };

  const rawUsers = await SearchProfile.find(query)
    .select(TOP_USERS_SELECT)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(Number(limit))
    .lean();

  return finalizeResults(rawUsers, viewerId);
};

const getTopMentors = async ({ limit = 10, mentorProfileVisibility } = {}, viewerId = null) => {
  const query = { isMentor: true };

  if (mentorProfileVisibility) query.mentorProfileVisibility = mentorProfileVisibility;
  if (viewerId) query.userId = { $ne: viewerId };

  const rawMentors = await SearchProfile.find(query)
    .select(TOP_USERS_SELECT)
    .sort({ searchScore: -1, profileCompletion: -1, lastActiveAt: -1 })
    .limit(Number(limit))
    .lean();

  return finalizeResults(rawMentors, viewerId);
};

const getSearchStats = async () => {
  const [totalPublicProfiles, recommendationReadyProfiles, mentors, roleBreakdown] = await Promise.all([
    SearchProfile.countDocuments({ visibility: "public" }),
    SearchProfile.countDocuments({ visibility: "public", recommendationEnabled: true }),
    SearchProfile.countDocuments({ visibility: "public", isMentor: true, mentorProfileVisibility: "public" }),
    SearchProfile.aggregate([
      { $match: { visibility: "public" } },
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { _id: 0, role: "$_id", count: 1 } },
      { $sort: { role: 1 } }
    ])
  ]);

  return {
    totalPublicProfiles,
    recommendationReadyProfiles,
    mentors,
    roleBreakdown
  };
};

module.exports = {
  searchUsers,
  searchBySkill,
  searchByBranch,
  searchByRole,
  searchByCompany,
  searchSuggestions,
  getSearchProfileByUserId,
  getTopUsers,
  getTopMentors,
  getSearchStats
};