// backend/src/modules/search/services/search.service.js
//
// UPDATED (Phase 3 — Search integration): added searchAll(), the only
// change in this file. Every existing function below (searchUsers,
// searchBySkill, buildSearchQuery, etc.) is byte-for-byte unchanged —
// this file's job was always "search PEOPLE (SearchProfile)"; Learning
// content lives in its own model/service (LearningSearchDocument.js /
// learningSearch.service.js — see that file's header for why it's a
// separate collection rather than a bolt-on to SearchProfile).
// searchAll() is the thin seam that lets ONE query hit both indexes
// and come back as one combined result, which is what actually closes
// the "Search me Learning ka zero integration" gap — a global search
// box has to return people AND resources/paths together, not force the
// frontend to know two different endpoints exist.
//
// UPDATED (Phase 1 follow-up — Events search integration): added
// searchEvents() and wired it into searchAll() as a third parallel
// branch (Users + Learning + Events). This closes the other
// zero-integration gap flagged in the phased upgrade plan: "Event.js
// model already has a text index (title, description, venue) and a
// tags field ... but search.service.js has no reference to Event".
// Deliberately NOT given its own LearningSearchDocument-style synced
// collection — Event is a small, single-collection domain (unlike
// Learning's resource+path split), so searchEvents() reads Event
// directly, same "search PEOPLE (SearchProfile)" directness this file
// already has, rather than introducing a second sync pipeline for a
// domain that doesn't need one. Read-only, one-directional: Search
// reads FROM Events, Events never pushes INTO Search — same pull
// pattern feedLearningInjector.js/feedEventInjector.js already use.
const SearchProfile = require("../models/SearchProfile");
const connectionService = require("../../connections/services/connection.service");
const { searchLearningContent } = require("./learningSearch.service");
const Event = require("../../events/models/Event");
const { EVENT_STATUS } = require("../../events/constants/event.constants");
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

// ── NEW (Phase 3) — combined people + Learning content search ──────
//
// Deliberately thin: runs searchUsers() (unchanged, above) and
// learningSearch.service.js's searchLearningContent() IN PARALLEL and
// returns them as two labeled buckets, rather than trying to merge
// people and resources/paths into one artificially-unified list with
// a fake shared "relevance score" — a Profile and a LearningResource
// don't have comparable ranking signals (searchScore vs
// popularityScore), so forcing one sort order across both would be
// misleading. The frontend renders two sections ("People" / "Learning")
// under one search box, same two-bucket pattern this codebase already
// uses elsewhere (e.g. Feed's injectLearningResources() keeping
// LearningResource cards visually distinct from FeedPost cards rather
// than pretending they're the same entity).
//
// `learning` filters (contentType/careerTrack/department/semester/type/
// difficulty/skill/tag) are passed through untouched to
// searchLearningContent() — see that function for what each means.
// Only `q`/`page`/`limit` are shared between the two searches; a
// caller wanting different paging for people vs content should call
// searchUsers()/searchLearningContent() separately instead.
// ── Events search (Phase 1 follow-up) ───────────────────────────────
// Mirrors getApprovedEvents()'s query shape in event.service.js exactly
// (same status/isDeleted/isArchived filter, same q/category/tag regex
// approach) rather than reusing that function directly — search.service.js
// never imports another module's *.service.js the same way
// learningSearch.service.js documents for its own reasoning, keeping
// Search's read path independent of an internal Events service
// signature that could change for reasons unrelated to search.
const EVENTS_SEARCH_SELECT =
  "title description category tags venue isVirtual startTime endTime bannerUrl status organizedBy communityId";

const buildEventSearchQuery = ({ q, category, tag } = {}) => {
  const query = {
    status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE] },
    isDeleted: false,
    isArchived: false
  };

  if (category) query.category = category;
  if (tag) query.tags = buildRegex(tag);

  if (q) {
    const keywordRegex = buildRegex(q);
    query.$or = [
      { title: keywordRegex },
      { description: keywordRegex },
      { venue: keywordRegex },
      { tags: keywordRegex }
    ];
  }

  return query;
};

const searchEvents = async (filters = {}) => {
  const { page, limit, skip } = buildPagination(filters);
  const query = buildEventSearchQuery(filters);

  const [events, total] = await Promise.all([
    Event.find(query)
      .select(EVENTS_SEARCH_SELECT)
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate("organizedBy", "username fullName role")
      .lean(),
    Event.countDocuments(query)
  ]);

  return {
    events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const searchAll = async (filters = {}, viewerId = null, viewerRole = null) => {
  const {
    q,
    page,
    limit,
    includeUsers = true,
    includeLearning = true,
    includeEvents = true,
    ...learningFilters
  } = filters;

  const [users, learning, events] = await Promise.all([
    includeUsers
      ? searchUsers({ q, page, limit }, viewerId)
      : Promise.resolve({ users: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 0 } }),
    includeLearning
      ? searchLearningContent({ ...learningFilters, q, page, limit }, viewerId, viewerRole)
      : Promise.resolve({ results: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 0 } }),
    includeEvents
      ? searchEvents({ q, page, limit })
      : Promise.resolve({ events: [], pagination: { total: 0, page: 1, limit: 0, totalPages: 0 } })
  ]);

  return {
    users: users.users,
    usersPagination: users.pagination,
    learning: learning.results,
    learningPagination: learning.pagination,
    events: events.events,
    eventsPagination: events.pagination
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
  getSearchStats,
  searchEvents, // NEW (Phase 1 follow-up)
  searchAll // NEW (Phase 3)
};