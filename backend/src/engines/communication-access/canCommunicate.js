// backend/src/engines/communication-access/canCommunicate.js
const hasAcceptedMentorship = async (userIdOne, userIdTwo) => {
  const mentorRequestService = require("../../modules/mentorship/services/mentorRequest.service");
  return mentorRequestService.hasAcceptedMentorship(userIdOne, userIdTwo);
};

// FIXED: getConnectionStatus() returns an OBJECT ({ status, requestId? }),
// not a bare string. This function used to compare the whole object
// directly against the RELATIONSHIP_STATUS.CONNECTED string constant,
// which is never === true in JS — so canCommunicate() silently treated
// EVERY connected pair as unconnected, permanently blocking direct
// messaging between users who were genuinely connected in the database.
const hasActiveConnection = async (userIdOne, userIdTwo) => {
  const connectionService = require("../../modules/connections/services/connection.service");
  const { RELATIONSHIP_STATUS } = require("../../modules/connections/constants/connection.constants");
  const { status } = await connectionService.getConnectionStatus(userIdOne, userIdTwo);
  return status === RELATIONSHIP_STATUS.CONNECTED;
};

// Communities module — lazy-required (function-scoped require, not
// top-of-file) to avoid a circular dependency: this engine is itself
// required by the Communication module, and CommunityMember could
// theoretically chain back here. Same defensive pattern already used
// for mentorship/connections above.
const isSameCommunity = async (userIdOne, userIdTwo) => {
  const CommunityMember = require("../../modules/communities/models/CommunityMember");

  const [membersA, membersB] = await Promise.all([
    CommunityMember.find({ userId: userIdOne }).select("communityId").lean(),
    CommunityMember.find({ userId: userIdTwo }).select("communityId").lean()
  ]);

  if (!membersA.length || !membersB.length) return false;

  const communityIdsA = new Set(membersA.map((m) => m.communityId.toString()));
  return membersB.some((m) => communityIdsA.has(m.communityId.toString()));
};

// Still a stub — no admin messaging policy decided yet.
const isAdminOverride = async (_userIdOne, _userIdTwo) => false; // TODO: admin messaging policy

/**
 * canCommunicate(userIdOne, userIdTwo)
 * Returns true/false. No side effects. Order of args doesn't matter.
 */
const canCommunicate = async (userIdOne, userIdTwo) => {
  if (!userIdOne || !userIdTwo) return false;
  if (userIdOne.toString() === userIdTwo.toString()) return false;

  if (await hasAcceptedMentorship(userIdOne, userIdTwo)) return true;
  if (await hasActiveConnection(userIdOne, userIdTwo)) return true;
  if (await isSameCommunity(userIdOne, userIdTwo)) return true;
  if (await isAdminOverride(userIdOne, userIdTwo)) return true;

  return false;
};

module.exports = { canCommunicate };