// backend/src/engines/communication-access/index.js
//
// Pure re-export — no logic. Lets callers do one import instead of two:
//   const { canCommunicate, getOrCreateDirectConversation } = require(".../engines/communication-access");

const { canCommunicate } = require("./canCommunicate");
const { getOrCreateDirectConversation } = require("./canCreateConversation");

module.exports = {
  canCommunicate,
  getOrCreateDirectConversation
};