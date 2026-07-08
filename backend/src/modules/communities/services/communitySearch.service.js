// backend/src/modules/communities/services/communitySearch.service.js
//
// No separate search-profile model needed — Community documents already
// carry name/tags/category/visibility with indexes. This is a thin
// query layer, not a new denormalized collection (unlike Users' SearchProfile,
// which needed one because it aggregates 5+ source collections).
//
// NOTE on "search not returning my community": this filter intentionally
// only returns visibility:"public" + status:"active" communities — this
// is by design (private/hidden communities are discoverable via
// join-request flow, not open search). If a community you expect to see
// doesn't show up, check its `visibility` field first — this was the
// same root cause as the public/private toggle bug (community.service.js
// / community.validator.js), now fixed there.

const Community = require("../models/Community");
const { VISIBILITY, COMMUNITY_STATUS, PAGINATION } = require("../constants/community.constants");

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchCommunities = async ({ keyword, category, tags, page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const filter = { visibility: VISIBILITY.PUBLIC, status: COMMUNITY_STATUS.ACTIVE };
  if (category) filter.category = category;
  if (tags?.length) filter.tags = { $in: tags };

  // FIX: guard against a whitespace-only keyword ("   ") producing an
  // empty regex that would match everything — trim first, only build
  // the $or clause if something real remains.
  const trimmedKeyword = keyword?.trim();
  if (trimmedKeyword) {
    const regex = new RegExp(escapeRegex(trimmedKeyword), "i");
    filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
  }

  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const skip = (Number(page) - 1) * pageSize;

  const [communities, total] = await Promise.all([
    Community.find(filter).sort({ memberCount: -1 }).skip(skip).limit(pageSize).lean(),
    Community.countDocuments(filter)
  ]);

  return { communities, pagination: { total, page: Number(page), limit: pageSize } };
};

module.exports = { searchCommunities };