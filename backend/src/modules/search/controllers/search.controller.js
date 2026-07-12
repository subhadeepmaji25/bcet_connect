// backend/src/modules/search/controllers/search.controller.js
//
// FIX applied in this version:
// Added getSearchStatsController. searchService.getSearchStats() has
// existed for a while, but nothing in this file called it, so
// GET /api/v1/search/stats had no route to hit and 404'd. See
// search.routes.js in this same patch for the matching route line.

const {
  searchUsers,
  searchBySkill,
  searchByBranch,
  searchByRole,
  searchByCompany,
  searchSuggestions,
  getSearchProfileByUserId,
  getSearchStats,
  searchAll,
  searchEvents
} = require("../services/search.service");
const {
  validateSearchUsersQuery,
  validateSearchAllQuery,
  validateSkill,
  validateBranch,
  validateCompany,
  validateRole,
  validateSuggestionQuery
} = require("../validators/search.validator");
const { buildSearchProfile } = require("../../../engines/search-profile/buildSearchProfile");
const sendResponse = require("../../../shared/response/sendResponse");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

const searchUsersController = async (req, res, next) => {
  try {
    const filters = validateSearchUsersQuery(req.query);
    const result = await searchUsers(filters, req.user.id);
    return sendResponse(res, {
      message: "Users fetched successfully",
      data: { users: result.users },
      meta: { pagination: result.pagination }
    });
  } catch (error) {
    logger.error("User search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchAllController = async (req, res, next) => {
  try {
    const filters = validateSearchAllQuery(req.query);
    const result = await searchAll(filters, req.user.id, req.user.role);
    return sendResponse(res, {
      message: "Search results fetched successfully",
      data: {
        users: result.users,
        learning: result.learning,
        events: result.events
      },
      meta: {
        usersPagination: result.usersPagination,
        learningPagination: result.learningPagination,
        eventsPagination: result.eventsPagination
      }
    });
  } catch (error) {
    logger.error("Global search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchBySkillController = async (req, res, next) => {
  try {
    const skill = validateSkill(req.params.skill);
    const users = await searchBySkill(skill, req.user.id);
    return sendResponse(res, {
      message: "Users fetched by skill successfully",
      data: { users },
      meta: { count: users.length }
    });
  } catch (error) {
    logger.error("Skill search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchByBranchController = async (req, res, next) => {
  try {
    const branch = validateBranch(req.params.branch);
    const users = await searchByBranch(branch, req.user.id);
    return sendResponse(res, {
      message: "Users fetched by branch successfully",
      data: { users },
      meta: { count: users.length }
    });
  } catch (error) {
    logger.error("Branch search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchByRoleController = async (req, res, next) => {
  try {
    const role = validateRole(req.params.role);
    const users = await searchByRole(role, req.user.id);
    return sendResponse(res, {
      message: "Users fetched by role successfully",
      data: { users },
      meta: { count: users.length }
    });
  } catch (error) {
    logger.error("Role search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchByCompanyController = async (req, res, next) => {
  try {
    const company = validateCompany(req.params.company);
    const users = await searchByCompany(company, req.user.id);
    return sendResponse(res, {
      message: "Users fetched by company successfully",
      data: { users },
      meta: { count: users.length }
    });
  } catch (error) {
    logger.error("Company search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const searchSuggestionsController = async (req, res, next) => {
  try {
    const keyword = validateSuggestionQuery(req.query.q);
    const suggestions = await searchSuggestions(keyword, req.user.id);
    return sendResponse(res, {
      message: "Search suggestions fetched successfully",
      data: { suggestions },
      meta: { count: suggestions.length }
    });
  } catch (error) {
    logger.error("Search suggestions failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const getMySearchProfileController = async (req, res, next) => {
  try {
    const searchProfile = await getSearchProfileByUserId(req.user.id);
    if (!searchProfile) {
      throw ApiError.notFound("Search profile not found. Run POST /api/v1/search/rebuild first.");
    }
    return sendResponse(res, {
      message: "Search profile fetched successfully",
      data: { searchProfile }
    });
  } catch (error) {
    logger.error("Fetch search profile failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

const rebuildMySearchProfileController = async (req, res, next) => {
  try {
    const searchProfile = await buildSearchProfile(req.user.id);
    return sendResponse(res, {
      message: "Search profile rebuilt successfully",
      data: { searchProfile }
    });
  } catch (error) {
    logger.error("Rebuild search profile failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

// NEW — closes the "/search/stats 404" gap. Aggregate/admin-facing
// endpoint, so it's intentionally NOT viewer-scoped (no connectionStatus,
// no private-profile projection) — it's just counts.
const getSearchStatsController = async (req, res, next) => {
  try {
    const stats = await getSearchStats();
    return sendResponse(res, {
      message: "Search stats fetched successfully",
      data: { stats }
    });
  } catch (error) {
    logger.error("Fetch search stats failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

// Standalone Events search — searchEvents() was already wired into
// searchAll() as a parallel branch, but had no dedicated route, so
// a frontend wanting ONLY events (e.g. the Events page's own search
// bar) had to call /search/all with includeLearning=false&includeUsers=false
// and pick the events bucket — awkward and over-fetching. This gives
// it a clean surface without touching searchAll().
// Accepts: q, category, tag, page, limit (same as searchAll's events slice).
const searchEventsController = async (req, res, next) => {
  try {
    const { q, category, tag, page, limit } = req.query;
    const filters = {
      ...(q && { q: String(q).trim().slice(0, 100) }),
      ...(category && { category: String(category).trim().toLowerCase() }),
      ...(tag && { tag: String(tag).trim().toLowerCase() }),
      page: Math.max(Number(page) || 1, 1),
      limit: Math.min(Math.max(Number(limit) || 10, 1), 50)
    };
    const result = await searchEvents(filters);
    return sendResponse(res, {
      message: "Events fetched successfully",
      data: { events: result.events },
      meta: { pagination: result.pagination }
    });
  } catch (error) {
    logger.error("Events search failed", error, { module: "Search", userId: req.user?.id });
    next(error);
  }
};

module.exports = {
  searchUsersController,
  searchAllController,
  searchEventsController,
  searchBySkillController,
  searchByBranchController,
  searchByRoleController,
  searchByCompanyController,
  searchSuggestionsController,
  getMySearchProfileController,
  rebuildMySearchProfileController,
  getSearchStatsController
};
