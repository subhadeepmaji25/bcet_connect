// backend/src/modules/feed/constants/feed.constants.js
//
// PHASE 2/3 UPDATE: Added RANKING_WEIGHTS (feedRanking.service.js),
// REACTION_TYPE (feedReaction.service.js), FEED_INJECTION
// (feedRecommendationInjector.js), VIEW_DEDUPE_WINDOW_HOURS
// (feedView.service.js). Phase 1 constants below are UNCHANGED —
// nothing that already worked was touched.

const POST_TYPE = {
  TEXT: "text",
  IMAGE: "image",
  DOCUMENT: "document",
  ANNOUNCEMENT: "announcement",
  ACHIEVEMENT: "achievement",
  RESOURCE: "resource",
  PROJECT_SHOWCASE: "project_showcase"
};
const POST_TYPE_VALUES = Object.values(POST_TYPE);

const VISIBILITY = {
  PUBLIC: "public",
  CONNECTIONS_ONLY: "connections_only"
};
const VISIBILITY_VALUES = Object.values(VISIBILITY);

const POST_STATUS = { ACTIVE: "active", HIDDEN: "hidden", REMOVED: "removed" };
const POST_STATUS_VALUES = Object.values(POST_STATUS);

const COMMENT_STATUS = { ACTIVE: "active", HIDDEN: "hidden", REMOVED: "removed" };
const COMMENT_STATUS_VALUES = Object.values(COMMENT_STATUS);

const MODERATION_STATUS = {
  APPROVED: "approved",
  FLAGGED: "flagged",
  BLOCKED: "blocked"
};
const MODERATION_STATUS_VALUES = Object.values(MODERATION_STATUS);

const REPORT_TARGET_TYPE = {
  POST: "post",
  COMMENT: "comment"
};
const REPORT_TARGET_TYPE_VALUES = Object.values(REPORT_TARGET_TYPE);

const REPORT_REASON = {
  SPAM: "spam",
  HARASSMENT: "harassment",
  HATE: "hate",
  SEXUAL: "sexual",
  VIOLENCE: "violence",
  MISINFORMATION: "misinformation",
  OTHER: "other"
};
const REPORT_REASON_VALUES = Object.values(REPORT_REASON);

const REPORT_STATUS = {
  PENDING: "pending",
  RESOLVED: "resolved",
  DISMISSED: "dismissed"
};
const REPORT_STATUS_VALUES = Object.values(REPORT_STATUS);

const LIMITS = {
  POST_CONTENT_MAX: 3000,
  COMMENT_CONTENT_MAX: 1000,
  ATTACHMENTS_MAX_PER_POST: 4,
  MENTIONS_MAX_PER_POST: 10,
  TAGS_MAX_PER_POST: 10,
  REPORT_NOTE_MAX: 500
};

const PAGINATION = {
  DEFAULT_LIMIT: 15,
  MAX_LIMIT: 30,
  // NEW — windowed re-ranking fetch size cap. See feedPost.service.js
  // getFeed(): we fetch more than pageSize to have something to rank,
  // but never more than this, no matter how big pageSize*multiplier gets.
  MAX_RANKING_WINDOW: 120
};

// ── NEW: Ranking weights (Phase 2) ──────────────────────────────────
// Same pattern as recommendation/constants/scoreWeights.js — fixed,
// rule-based weights that must sum to 100, fail-fast at boot if not.
// Change weights HERE only; feedRanking.service.js never hardcodes a %.
const RANKING_WEIGHTS = Object.freeze({
  CONNECTION: 30,   // author is a direct connection
  COMMUNITY: 20,    // author shares a community with the viewer
  MENTOR: 20,       // author is viewer's accepted mentor
  FRESHNESS: 20,    // time-decay component
  ENGAGEMENT: 10,   // likes + comments component
  ROLE_BOOST: 8,
  PINNED_BOOST: 35
});
const RANKING_WEIGHT_TOTAL = Object.entries(RANKING_WEIGHTS)
  .filter(([key]) => !key.endsWith("_BOOST"))
  .reduce((sum, [, w]) => sum + w, 0);
if (RANKING_WEIGHT_TOTAL !== 100) {
  throw new Error(`RANKING_WEIGHTS must sum to 100, currently sums to ${RANKING_WEIGHT_TOTAL}`);
}

// Freshness halves every N hours — Reddit-style decay, minus the
// upvote-velocity part (Feed doesn't have votes).
const FRESHNESS_HALF_LIFE_HOURS = 18;

// getFeed() fetches pageSize * this many posts before ranking/slicing.
const RANKING_WINDOW_MULTIPLIER = 4;

// ── NEW: Reactions (Phase 2) ────────────────────────────────────────
const REACTION_TYPE = {
  LIKE: "like",
  CELEBRATE: "celebrate",
  SUPPORT: "support",
  INSIGHTFUL: "insightful",
  CURIOUS: "curious"
};
const REACTION_TYPE_VALUES = Object.values(REACTION_TYPE);

const REACTION_TARGET_TYPE = REPORT_TARGET_TYPE;
const REACTION_TARGET_TYPE_VALUES = REPORT_TARGET_TYPE_VALUES;

const FEED_ADMIN_ROLES = Object.freeze(["admin"]);
const FEED_ANNOUNCEMENT_ROLES = Object.freeze(["admin", "faculty"]);

// ── NEW: Recommendation injection (Phase 3) ─────────────────────────
const FEED_INJECTION = {
  INTERVAL: 5,             // insert 1 suggestion card every N real posts
  MAX_PER_PAGE: 2,         // never more than this many synthetic cards per page
  JOB_POOL_SCAN_LIMIT: 100 // cap on jobs scanned per feed load — cheap, not exhaustive
};

// ── NEW: View/impression tracking (Phase 3) ─────────────────────────
// Re-viewing the same post within this window doesn't count as a new view.
const VIEW_DEDUPE_WINDOW_HOURS = 12;

module.exports = {
  POST_TYPE, POST_TYPE_VALUES,
  VISIBILITY, VISIBILITY_VALUES,
  POST_STATUS, POST_STATUS_VALUES,
  COMMENT_STATUS, COMMENT_STATUS_VALUES,
  MODERATION_STATUS, MODERATION_STATUS_VALUES,
  REPORT_TARGET_TYPE, REPORT_TARGET_TYPE_VALUES,
  REPORT_REASON, REPORT_REASON_VALUES,
  REPORT_STATUS, REPORT_STATUS_VALUES,
  LIMITS,
  PAGINATION,
  RANKING_WEIGHTS,
  FRESHNESS_HALF_LIFE_HOURS,
  RANKING_WINDOW_MULTIPLIER,
  REACTION_TYPE, REACTION_TYPE_VALUES,
  REACTION_TARGET_TYPE, REACTION_TARGET_TYPE_VALUES,
  FEED_INJECTION,
  VIEW_DEDUPE_WINDOW_HOURS,
  FEED_ADMIN_ROLES,
  FEED_ANNOUNCEMENT_ROLES
};
