// backend/src/modules/recommendation/services/ranking.service.js
const { RECOMMENDATION_MIN_SCORE } = require("../constants/scoreWeights");
const filterRecommendable = (scoredJobs = [], { minScore = RECOMMENDATION_MIN_SCORE, eligibleOnly = true } = {}) => {
  return scoredJobs.filter(({ match }) => {
    if (eligibleOnly && !match.eligible) return false;
    if (match.finalScore < minScore) return false;
    return true;
  });
};
const sortByRank = (scoredJobs = []) => {
  return [...scoredJobs].sort((a, b) => {
    const featuredDiff = Number(b.job?.metadata?.featured) - Number(a.job?.metadata?.featured);
    if (featuredDiff !== 0) return featuredDiff;

    const scoreDiff = b.match.finalScore - a.match.finalScore;
    if (scoreDiff !== 0) return scoreDiff;

    const priorityDiff = Number(b.job?.metadata?.priority || 0) - Number(a.job?.metadata?.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    const verifiedDiff = Number(b.job?.metadata?.verifiedCompany) - Number(a.job?.metadata?.verifiedCompany);
    if (verifiedDiff !== 0) return verifiedDiff;

    return new Date(b.job?.createdAt || 0) - new Date(a.job?.createdAt || 0);
  });
};

const paginate = (items = [], { page = 1, limit = 10 } = {}) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(50, Math.max(1, Number(limit) || 10));
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    pagination: {
      total: items.length,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(items.length / safeLimit))
    }
  };
};
const rankAndPaginate = (scoredJobs = [], { minScore, eligibleOnly, page, limit } = {}) => {
  const recommendable = filterRecommendable(scoredJobs, { minScore, eligibleOnly });
  const ranked = sortByRank(recommendable);
  return paginate(ranked, { page, limit });
};

module.exports = {
  filterRecommendable,
  sortByRank,
  paginate,
  rankAndPaginate
};