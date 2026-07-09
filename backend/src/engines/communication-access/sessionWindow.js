// backend/src/engines/communication-access/sessionWindow.js
//
// Answers a narrower, TIME-based question than canCommunicate(): for a
// mentorship-type conversation, is there a session whose live window
// [scheduledAt, endsAt) contains right now? This is deliberately
// separate from canCommunicate() — that answers a RELATIONSHIP question
// ("has this mentor/student pair ever had an accepted request") and is
// checked once, at conversation-creation time. Session-window gating
// must be re-checked on every send, because unlike a relationship, it
// changes on its own as time passes without any user action.
//
// Checks status $nin SESSION_TERMINAL_STATUSES (not just "live") plus a
// real-time scheduledAt/endsAt comparison — this is intentional. The
// session-lifecycle cron (scheduleMentorSessionCron.js) only flips
// scheduled → live once a minute, so relying on status === "live" alone
// would create up to a ~60s window where a session's real-time window
// has genuinely started but the status label hasn't caught up yet,
// wrongly blocking a message that should be allowed. The time
// comparison here is authoritative; status is only used to exclude
// sessions that are already cancelled/completed/no-show.
//
// Lazy-required (function-scoped, not top-of-file) to match the
// defensive pattern already used in canCreateConversation.js — this
// file lives in the same engine folder that Communication imports from,
// so a top-level require of the Mentorship model here could risk the
// same circular-load class of bug documented there.
const isMentorshipConversationCurrentlySendable = async (conversation) => {
  const { CONVERSATION_TYPES } = require("../../modules/communication/constants/communication.constants");
  if (conversation.type !== CONVERSATION_TYPES.MENTORSHIP) return true; // gating only applies to mentorship chats

  const MentorSession = require("../../modules/mentorship/models/MentorSession");
  const { SESSION_TERMINAL_STATUSES } = require("../../modules/mentorship/constants/mentor.constants");
  const now = new Date();

  const liveSession = await MentorSession.findOne({
    conversationId: conversation._id,
    status: { $nin: SESSION_TERMINAL_STATUSES },
    scheduledAt: { $lte: now },
    endsAt: { $gt: now }
  }).select("_id").lean();

  return Boolean(liveSession);
};

module.exports = { isMentorshipConversationCurrentlySendable };