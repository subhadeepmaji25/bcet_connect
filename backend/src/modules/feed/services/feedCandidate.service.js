// backend/src/modules/feed/services/feedCandidate.service.js
//
// PHASE 1 (intentionally simple): candidates = "my connections + myself".
// No community/mentor/faculty weighting yet — that's Phase 2, and it
// plugs into this ONE function's return value. feedPost.service.js's
// getFeed() never needs to change when that happens.

const Connection = require("../../connections/models/Connection");
const { CONNECTION_STATUS } = require("../../connections/constants/connection.constants");

const getCandidateAuthorIds = async (userId) => {
  const connections = await Connection.find({
    status: CONNECTION_STATUS.ACTIVE,
    $or: [{ userA: userId }, { userB: userId }]
  }).select("userA userB").lean();

  const connectedIds = connections.map((c) =>
    c.userA.toString() === userId.toString() ? c.userB : c.userA
  );

  // Always include the viewer's own posts, even with zero connections.
  return [...connectedIds, userId];
};

module.exports = { getCandidateAuthorIds };