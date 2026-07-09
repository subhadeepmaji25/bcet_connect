// backend/src/modules/feed/services/feedCandidate.service.js
//
// PHASE 2: candidates now come from THREE sources — connections,
// shared communities, accepted mentors — plus self. Return shape
// changed from a plain array (Phase 1) to { authorIds, sourceFlags },
// exactly as the Phase 2 plan specified. feedRanking.service.js is the
// ONLY other file that reads sourceFlags — feedPost.service.js just
// passes it through untouched.

const Connection = require("../../connections/models/Connection");
const { CONNECTION_STATUS } = require("../../connections/constants/connection.constants");
const CommunityMember = require("../../communities/models/CommunityMember");
const MentorRequest = require("../../mentorship/models/MentorRequest");
const { REQUEST_STATUS: MENTOR_REQUEST_STATUS } = require("../../mentorship/constants/mentor.constants");
const FeedPost = require("../models/FeedPost");
const {
  POST_STATUS,
  MODERATION_STATUS,
  VISIBILITY,
  POST_TYPE
} = require("../constants/feed.constants");

// Communities a single viewer can belong to before we stop fanning out
// to "who else is in these" — protects against one user in 50
// communities turning every feed load into a huge member scan.
const MAX_COMMUNITIES_CONSIDERED = 30;
const MAX_COMMUNITY_MEMBERS_SCANNED = 2000;
const MAX_ANNOUNCEMENT_AUTHORS = 25;

const getCandidateAuthorIds = async (userId) => {
  const userIdStr = userId.toString();
  const sourceFlags = new Map();

  const markFlag = (authorId, flagKey) => {
    const key = authorId.toString();
    const existing = sourceFlags.get(key) || {
      isSelf: false, isConnection: false, isCommunity: false, isMentor: false, isAnnouncement: false
    };
    existing[flagKey] = true;
    sourceFlags.set(key, existing);
  };

  // Always include the viewer's own posts, even with zero connections.
  markFlag(userId, "isSelf");

  const [connections, myMemberships, acceptedMentorships] = await Promise.all([
    Connection.find({
      status: CONNECTION_STATUS.ACTIVE,
      $or: [{ userA: userId }, { userB: userId }]
    }).select("userA userB").lean(),

    CommunityMember.find({ userId, isBanned: false }).select("communityId").lean(),

    MentorRequest.find({
      studentId: userId,
      status: MENTOR_REQUEST_STATUS.ACCEPTED
    }).select("mentorId").lean()
  ]);

  connections.forEach((c) => {
    const otherId = c.userA.toString() === userIdStr ? c.userB : c.userA;
    markFlag(otherId, "isConnection");
  });

  acceptedMentorships.forEach((r) => markFlag(r.mentorId, "isMentor"));

  // Community candidates need a second query — find who ELSE is in the
  // communities the viewer belongs to. Capped both on communities
  // considered and members scanned, so this stays cheap on every feed load.
  const communityIds = myMemberships.map((m) => m.communityId).slice(0, MAX_COMMUNITIES_CONSIDERED);
  if (communityIds.length) {
    const communityMembers = await CommunityMember.find({
      communityId: { $in: communityIds },
      isBanned: false
    }).select("userId").limit(MAX_COMMUNITY_MEMBERS_SCANNED).lean();

    communityMembers.forEach((m) => markFlag(m.userId, "isCommunity"));
  }

  // Faculty/admin announcements are a platform-level broadcast, not
  // just a network post. Include the announcement authors so their
  // feed posts can survive candidate filtering even when the viewer
  // does not share a direct graph edge with them.
  const announcementPosts = await FeedPost.find({
    status: POST_STATUS.ACTIVE,
    visibility: VISIBILITY.PUBLIC,
    type: POST_TYPE.ANNOUNCEMENT,
    moderationStatus: MODERATION_STATUS.APPROVED
  })
    .sort({ pinnedAt: -1, createdAt: -1 })
    .select("authorId")
    .limit(MAX_ANNOUNCEMENT_AUTHORS)
    .lean();

  announcementPosts.forEach((post) => markFlag(post.authorId, "isAnnouncement"));

  return { authorIds: Array.from(sourceFlags.keys()), sourceFlags };
};

module.exports = { getCandidateAuthorIds };
