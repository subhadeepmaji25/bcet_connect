// backend/src/modules/feed/services/feedRanking.service.js
//
// PHASE 2 ranking — rule-based, same philosophy as
// recommendation/constants/scoreWeights.js (fixed weights, no ML).
// This is the ONLY file that turns "who wrote it + when + engagement"
// into one sortable score. feedPost.service.js just calls
// rankFeedPosts(batch, sourceFlags) and slices the top N — it never
// computes a score itself.

const { RANKING_WEIGHTS, FRESHNESS_HALF_LIFE_HOURS } = require("../constants/feed.constants");

const MS_PER_HOUR = 1000 * 60 * 60;

// After populate("authorId", "username role"), post.authorId is an
// OBJECT ({_id, username, role}), not a plain ObjectId — this resolves
// either shape back to a comparable string so it matches sourceFlags' keys.
const resolveAuthorIdString = (post) => {
  const authorId = post.authorId;
  if (authorId && typeof authorId === "object" && authorId._id) return authorId._id.toString();
  return authorId.toString();
};

// Exponential decay — halves every FRESHNESS_HALF_LIFE_HOURS. Reddit's
// "hot" idea, minus the vote-velocity part (Feed has no votes).
const calculateFreshnessScore = (createdAt, now) => {
  const ageHours = Math.max(0, (now - new Date(createdAt).getTime()) / MS_PER_HOUR);
  const decay = Math.pow(0.5, ageHours / FRESHNESS_HALF_LIFE_HOURS);
  return decay * 100; // 0–100
};

// Log-scaled so 200 likes doesn't score 20x a 10-like post.
const calculateEngagementScore = (likeCount = 0, commentCount = 0) => {
  const raw = likeCount + commentCount * 2; // comments weigh more than likes
  return Math.min(100, Math.log2(raw + 1) * 20);
};

const calculateSourceScore = (flags = {}) => {
  if (flags.isSelf) return RANKING_WEIGHTS.CONNECTION + RANKING_WEIGHTS.COMMUNITY + RANKING_WEIGHTS.MENTOR; // always max within the source band — you always see your own posts prioritized
  let score = 0;
  if (flags.isConnection) score += RANKING_WEIGHTS.CONNECTION;
  if (flags.isCommunity) score += RANKING_WEIGHTS.COMMUNITY;
  if (flags.isMentor) score += RANKING_WEIGHTS.MENTOR;
  return score;
};

const calculatePlatformBoost = (post) => {
  let score = 0;
  const authorRole = post.authorId && typeof post.authorId === "object" ? post.authorId.role : null;
  if (post.isPinned) score += RANKING_WEIGHTS.PINNED_BOOST;
  if (authorRole === "admin" || authorRole === "faculty") score += RANKING_WEIGHTS.ROLE_BOOST;
  return score;
};

const scorePost = (post, sourceFlags, now = Date.now()) => {
  const flags = sourceFlags.get(resolveAuthorIdString(post)) || {};

  const sourceScore = calculateSourceScore(flags); // max 70 (30+20+20)
  const freshnessScore = calculateFreshnessScore(post.createdAt, now) * (RANKING_WEIGHTS.FRESHNESS / 100);
  const engagementScore = calculateEngagementScore(post.likeCount, post.commentCount) * (RANKING_WEIGHTS.ENGAGEMENT / 100);

  return sourceScore + freshnessScore + engagementScore + calculatePlatformBoost(post);
};

// Returns a NEW sorted array — never mutates the input.
const rankFeedPosts = (posts, sourceFlags, now = Date.now()) => {
  return posts
    .map((post) => ({ post, score: scorePost(post, sourceFlags, now) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.post);
};

module.exports = {
  calculateFreshnessScore,
  calculateEngagementScore,
  calculateSourceScore,
  calculatePlatformBoost,
  scorePost,
  rankFeedPosts
};
