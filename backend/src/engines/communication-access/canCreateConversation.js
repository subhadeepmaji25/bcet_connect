// backend/src/engines/communication-access/canCreateConversation.js
//
// FIXED — same circular-require cause as canCommunicate.js: this file
// requires conversation.service.js, which itself requires this engine
// (via index.js) while conversation.service.js is still mid-load. The
// top-level require here used to bind `conversationService` to an
// incomplete/empty exports object at boot, so getOrCreateDirectConversation
// would throw "conversationService.getOrCreateConversation is not a
// function" whenever it was actually called.
//
// Fix: lazy require inside the function. Conversation lifecycle is still
// owned entirely by conversation.service.js — this file remains a thin
// pass-through, nothing architectural changes.

const getOrCreateDirectConversation = async (userIdOne, userIdTwo, type) => {
  const conversationService = require("../../modules/communication/services/conversation.service");
  const { CONVERSATION_TYPES } = require("../../modules/communication/constants/communication.constants");
  return conversationService.getOrCreateConversation(userIdOne, userIdTwo, type || CONVERSATION_TYPES.DIRECT);
};

module.exports = { getOrCreateDirectConversation };