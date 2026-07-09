// backend/src/modules/feed/constants/feed.constants.js
//
// Phase 1 (MVP) only. Ranking weights, POLL/EVENT_SHARE/JOB_SHARE post
// types, and FeedReaction/FeedBookmark/FeedView models are deliberately
// NOT here yet — Feed is built in phases on this same folder structure,
// never rewritten. See feed module design notes.

const POST_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  DOCUMENT: "document",
  ACHIEVEMENT: "achievement",
  RESOURCE: "resource",
  PROJECT_SHOWCASE: "project_showcase"
};
const POST_TYPE_VALUES = Object.values(POST_TYPE);

// CONNECTIONS_ONLY matters more once Phase 2 widens candidate sources
// beyond "connections + self" — kept here now so model/validator don't
// need a migration later.
const VISIBILITY = {
  PUBLIC: "public",
  CONNECTIONS_ONLY: "connections_only"
};
const VISIBILITY_VALUES = Object.values(VISIBILITY);

const POST_STATUS = { ACTIVE: "active", REMOVED: "removed" };
const POST_STATUS_VALUES = Object.values(POST_STATUS);

const COMMENT_STATUS = { ACTIVE: "active", REMOVED: "removed" };
const COMMENT_STATUS_VALUES = Object.values(COMMENT_STATUS);

const LIMITS = {
  POST_CONTENT_MAX: 3000,
  COMMENT_CONTENT_MAX: 1000,
  ATTACHMENTS_MAX_PER_POST: 4,
  MENTIONS_MAX_PER_POST: 10,
  TAGS_MAX_PER_POST: 10
};

const PAGINATION = {
  DEFAULT_LIMIT: 15,
  MAX_LIMIT: 30
};

module.exports = {
  POST_TYPE, POST_TYPE_VALUES,
  VISIBILITY, VISIBILITY_VALUES,
  POST_STATUS, POST_STATUS_VALUES,
  COMMENT_STATUS, COMMENT_STATUS_VALUES,
  LIMITS,
  PAGINATION
};