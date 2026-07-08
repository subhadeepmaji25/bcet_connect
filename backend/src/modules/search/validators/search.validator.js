// backend/src/modules/search/validators/search.validator.js
//
// FIX applied in this version:
//
// Empty-string query params (e.g. a frontend sending
// "?passoutYear=&minCompletion=&recommendationReady=&isMentor=&company=&branch=&role=&q="
// for every filter it isn't actually using) used to be treated as
// "value provided" because they are !== undefined. This crashed
// passoutYear specifically: Number("") === 0, which passed the
// Number.isInteger() check, then failed the "year < 1950" range
// check, throwing "Invalid passout year" for a filter the user never
// touched. The same shape of bug was latent in minCompletion
// (Number("") === 0 happens to pass 0-100 range silently, but still
// wrongly added a filters.minCompletion = 0 the caller never asked
// for) and in company/branch/q (harmless today, but wrong intent).
//
// Fix: a single isProvided() guard is used before validating every
// optional filter, so "not provided" and "provided as empty string"
// are both treated as "skip this filter" — matching how HTML forms
// and query-string builders actually behave in the browser.

const ApiError = require("../../../shared/errors/ApiError");

const ALLOWED_ROLES = [
  "student",
  "faculty",
  "alumni",
  "admin"
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

// A query param counts as "provided" only if it exists AND isn't an
// empty/whitespace-only string. This is the guard that fixes the
// empty-string bug described above — applied uniformly to every
// optional filter below instead of only to passoutYear.
const isProvided = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
};

const normalizeString = (value, fieldName, maxLength) => {
  if (Array.isArray(value) || typeof value !== "string") {
    throw ApiError.badRequest(`${fieldName} must be a string`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw ApiError.badRequest(`${fieldName} is too long`);
  }

  return normalized;
};

const normalizeRequiredString = (value, fieldName, minLength, maxLength) => {
  if (!value) {
    throw ApiError.badRequest(`${fieldName} is required`);
  }

  const normalized = normalizeString(value, fieldName, maxLength);

  if (normalized.length < minLength) {
    throw ApiError.badRequest(
      `${fieldName} must contain at least ${minLength} characters`
    );
  }

  return normalized;
};

const normalizeBoolean = (value, fieldName) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value) || typeof value !== "string") {
    throw ApiError.badRequest(`${fieldName} must be true or false`);
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  throw ApiError.badRequest(`${fieldName} must be true or false`);
};

const normalizeInteger = (value, fieldName) => {
  if (Array.isArray(value)) {
    throw ApiError.badRequest(`${fieldName} must be a valid number`);
  }

  const number = Number(value);

  if (!Number.isInteger(number)) {
    throw ApiError.badRequest(`${fieldName} must be a valid integer`);
  }

  return number;
};

const normalizePage = (value) => {
  if (value === undefined) {
    return DEFAULT_PAGE;
  }

  const page = Number(value);

  if (!Number.isInteger(page) || page < 1) {
    return DEFAULT_PAGE;
  }

  return page;
};

const normalizeLimit = (value) => {
  if (value === undefined) {
    return DEFAULT_LIMIT;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(limit, MAX_LIMIT);
};

const validateSearchUsersQuery = (query = {}) => {
  const {
    q,
    role,
    branch,
    passoutYear,
    company,
    minCompletion,
    recommendationReady,
    isMentor,
    page,
    limit
  } = query;

  const filters = {};

  // FIX — every optional filter below now uses isProvided() instead of
  // a bare `!== undefined` check, so an empty-string query param is
  // correctly treated as "this filter was not set" rather than "this
  // filter was set to an invalid/zero value".

  if (isProvided(q)) {
    filters.q = normalizeString(q, "Search query", 100);
  }

  if (isProvided(role)) {
    const normalizedRole = normalizeString(role, "Role", 30).toLowerCase();

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      throw ApiError.badRequest("Invalid role filter");
    }

    filters.role = normalizedRole;
  }

  if (isProvided(branch)) {
    filters.branch = normalizeString(branch, "Branch", 100);
  }

  if (isProvided(company)) {
    filters.company = normalizeString(company, "Company", 150);
  }

  if (isProvided(passoutYear)) {
    const year = normalizeInteger(passoutYear, "Passout year");
    const currentYear = new Date().getFullYear();

    if (year < 1950 || year > currentYear + 10) {
      throw ApiError.badRequest("Invalid passout year");
    }

    filters.passoutYear = year;
  }

  if (isProvided(minCompletion)) {
    const completion = Number(minCompletion);

    if (!Number.isFinite(completion) || completion < 0 || completion > 100) {
      throw ApiError.badRequest("minCompletion must be between 0 and 100");
    }

    filters.minCompletion = completion;
  }

  if (isProvided(recommendationReady)) {
    filters.recommendationReady = normalizeBoolean(
      recommendationReady,
      "recommendationReady"
    );
  }

  if (isProvided(isMentor)) {
    filters.isMentor = normalizeBoolean(isMentor, "isMentor");
  }

  filters.page = normalizePage(page);
  filters.limit = normalizeLimit(limit);

  return filters;
};

const validateSkill = (skill) =>
  normalizeRequiredString(skill, "Skill", 2, 100);

const validateBranch = (branch) =>
  normalizeRequiredString(branch, "Branch", 2, 100);

const validateCompany = (company) =>
  normalizeRequiredString(company, "Company", 2, 150);

const validateRole = (role) => {
  const normalizedRole = normalizeRequiredString(role, "Role", 2, 30)
    .toLowerCase();

  if (!ALLOWED_ROLES.includes(normalizedRole)) {
    throw ApiError.badRequest("Invalid role");
  }

  return normalizedRole;
};

const validateSuggestionQuery = (q) => {
  if (q === undefined || q === null || q === "") {
    return "";
  }

  return normalizeString(q, "Suggestion query", 50);
};

module.exports = {
  validateSearchUsersQuery,
  validateSkill,
  validateBranch,
  validateCompany,
  validateRole,
  validateSuggestionQuery
};