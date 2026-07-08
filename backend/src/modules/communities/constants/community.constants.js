// backend/src/modules/communities/constants/community.constants.js
//
// UPDATED (this pass):
// 1. Added `requiresJoinRequest(community)` — single source of truth for
//    "does joining this community need approval". Previously this logic
//    was implicitly duplicated (and inconsistently) across
//    communityMember.service.js's joinCommunity() and
//    communityJoinRequest.service.js's createRequest() — each only
//    checked `visibility`, neither one honored `settings.requireApproval`
//    on PUBLIC communities, which is why that field existed on the model
//    but never actually did anything. Now both services import this one
//    function, so they can never disagree with each other again.
// 2. Added `getJoinMode(community, isMember)` — thin wrapper used by
//    community.service.js to tell the frontend upfront whether tapping
//    "Join" on a card should call the instant-join endpoint or the
//    join-request endpoint, without the frontend having to reimplement
//    the visibility/requireApproval logic itself.

const VISIBILITY = {
  PUBLIC: "public",
  PRIVATE: "private",
  HIDDEN: "hidden"
};
const VISIBILITY_VALUES = Object.values(VISIBILITY);

const COMMUNITY_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  BANNED: "banned"
};
const COMMUNITY_STATUS_VALUES = Object.values(COMMUNITY_STATUS);

const MEMBER_ROLES = {
  OWNER: "owner",
  LEADER: "leader",
  CO_LEADER: "co-leader",
  MODERATOR: "moderator",
  MEMBER: "member"
};
const MEMBER_ROLES_VALUES = Object.values(MEMBER_ROLES);

const ROLE_HIERARCHY = {
  [MEMBER_ROLES.OWNER]: 5,
  [MEMBER_ROLES.LEADER]: 4,
  [MEMBER_ROLES.CO_LEADER]: 3,
  [MEMBER_ROLES.MODERATOR]: 2,
  [MEMBER_ROLES.MEMBER]: 1
};

const ROLE_PERMISSIONS = {
  [MEMBER_ROLES.OWNER]: ["*"],
  [MEMBER_ROLES.LEADER]: [
    "manage_members", "manage_feed", "manage_chat",
    "promote_moderator", "approve_join_request", "edit_community"
  ],
  [MEMBER_ROLES.CO_LEADER]: [
    "manage_members_below", "manage_feed", "approve_join_request"
  ],
  [MEMBER_ROLES.MODERATOR]: [
    "delete_post", "delete_comment", "pin_post", "mute_member", "warn_member"
  ],
  [MEMBER_ROLES.MEMBER]: ["read", "write"]
};

const JOIN_REQUEST_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};
const JOIN_REQUEST_STATUS_VALUES = Object.values(JOIN_REQUEST_STATUS);

const POST_TYPES = {
  NORMAL: "normal",
  ANNOUNCEMENT: "announcement",
  PINNED: "pinned",
  RESOURCE: "resource",
  POLL: "poll" // reserved — service logic not built yet
};
const POST_TYPES_VALUES = Object.values(POST_TYPES);

const POST_STATUS = {
  ACTIVE: "active",
  REMOVED: "removed"
};
const POST_STATUS_VALUES = Object.values(POST_STATUS);

const CATEGORIES = [
  "technology", "career", "academic", "hobby", "sports",
  "arts", "entrepreneurship", "social-cause", "other"
];

const LIMITS = {
  MAX_MEMBERS: 500,
  NAME_MIN: 3,
  NAME_MAX: 60,
  DESCRIPTION_MAX: 500,
  RULES_MAX_ITEMS: 15,
  RULE_MAX_LENGTH: 200,
  TAGS_MAX: 10,
  POST_CONTENT_MAX: 2000,
  COMMENT_MAX: 500,
  JOIN_MESSAGE_MAX: 300,
  ATTACHMENTS_MAX_PER_POST: 5,
  MENTIONS_MAX_PER_POST: 20
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50
};

// ── Join-mode resolution (single source of truth) ──────────────────
// A community needs a join REQUEST (instead of an instant join) when:
//   - it isn't PUBLIC at all (PRIVATE or HIDDEN), OR
//   - it IS public but the owner/leader has explicitly turned on
//     settings.requireApproval (e.g. "Placement Cell" wants to vet
//     members even though the community itself is discoverable).
// Every place in the codebase that needs to answer "can this user tap
// Join directly, or do they need to request?" MUST call this function
// instead of re-deriving the condition inline.
const requiresJoinRequest = (community) =>
  community.visibility !== VISIBILITY.PUBLIC || community.settings?.requireApproval === true;

// "member" | "instant" | "request" — used by community.service.js to
// annotate list/detail responses so the frontend doesn't have to guess
// which endpoint (join vs join-requests) to call for a given card.
const getJoinMode = (community, isMember) => {
  if (isMember) return "member";
  return requiresJoinRequest(community) ? "request" : "instant";
};

module.exports = {
  VISIBILITY, VISIBILITY_VALUES,
  COMMUNITY_STATUS, COMMUNITY_STATUS_VALUES,
  MEMBER_ROLES, MEMBER_ROLES_VALUES, ROLE_HIERARCHY, ROLE_PERMISSIONS,
  JOIN_REQUEST_STATUS, JOIN_REQUEST_STATUS_VALUES,
  POST_TYPES, POST_TYPES_VALUES,
  POST_STATUS, POST_STATUS_VALUES,
  CATEGORIES,
  LIMITS,
  PAGINATION,
  requiresJoinRequest,
  getJoinMode
};