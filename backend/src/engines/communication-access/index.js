// backend/src/engines/communication-access/index.js
//
// Pure re-export — no logic. Lets callers do one import instead of three:
//   const { canCommunicate, getOrCreateDirectConversation, isMentorshipConversationCurrentlySendable } = require(".../engines/communication-access");

const { canCommunicate } = require("./canCommunicate");
const { getOrCreateDirectConversation } = require("./canCreateConversation");
const { isMentorshipConversationCurrentlySendable } = require("./sessionWindow"); // NEW

module.exports = {
  canCommunicate,
  getOrCreateDirectConversation,
  isMentorshipConversationCurrentlySendable // NEW
};