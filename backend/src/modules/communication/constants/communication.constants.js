// backend/src/modules/communication/constants/communication.constants.js
//
// Single source of truth for the Communication module — pure vocabulary,
// no logic, same discipline as mentor.constants.js / connection.constants.js.
//
// REMOVED in this update: the local NOTIFICATION_EVENTS block that used
// to live at the bottom of this file (MESSAGE_SENT: "communication.
// message.sent", CONVERSATION_ARCHIVED: "communication.conversation.
// archived"). It was marked "not consumed anywhere yet" — and now that
// notification.constants.js exists as the actual canonical event list
// (with MESSAGE_RECEIVED: "communication.message.received" — a
// DIFFERENT string than this file's old MESSAGE_SENT), keeping both
// around was a live bug waiting to happen: if anyone had imported
// THIS file's NOTIFICATION_EVENTS.MESSAGE_SENT and called notify()
// with it, notification.listener.js's NOTIFICATION_EVENT_VALUES check
// would silently reject it (unknown event, just a warning log) and no
// notification would ever be created — a hard-to-debug silent failure.
//
// message.service.js's sendMessage() now correctly imports
// NOTIFICATION_EVENTS from modules/notification/constants/
// notification.constants.js instead. If Communication ever needs a
// CONVERSATION_ARCHIVED-style event, it should be added to THAT file
// (the platform-wide contract), not re-declared here.

const CONVERSATION_TYPES = {
  DIRECT: "direct",
  MENTORSHIP: "mentorship",
  COMMUNITY: "community" // reserved for future — no Communities module yet
};
const CONVERSATION_TYPE_VALUES = Object.values(CONVERSATION_TYPES);

const CONVERSATION_STATUS = {
  ACTIVE: "active",
  ARCHIVED: "archived",
  CLOSED: "closed" // reserved — e.g. if a connection is later removed
};
const CONVERSATION_STATUS_VALUES = Object.values(CONVERSATION_STATUS);

// UPGRADED: VOICE_NOTE and VIDEO added so a message's top-level type can
// reflect voice/video attachments distinctly (used for inbox previews,
// e.g. showing a mic icon instead of a generic paperclip).
const MESSAGE_TYPES = {
  TEXT: "text",
  IMAGE: "image",
  DOCUMENT: "document",
  VOICE_NOTE: "voice_note",
  VIDEO: "video",
  SYSTEM: "system" // e.g. "Mentorship request accepted" auto-message
};
const MESSAGE_TYPE_VALUES = Object.values(MESSAGE_TYPES);

const MESSAGE_STATUS = {
  SENT: "sent",
  DELIVERED: "delivered", // reserved for future (needs presence/socket layer)
  READ: "read"
};
const MESSAGE_STATUS_VALUES = Object.values(MESSAGE_STATUS);

// UPGRADED: VOICE_NOTE and VIDEO added — shared/media/media.constants.js
// already has CHAT_VOICE_NOTE and CHAT_VIDEO wired (mime types, size caps),
// but this module's own vocabulary never picked them up. Without this,
// Message.js's attachment enum would reject a voice/video attachment
// even after the upload itself succeeded — exactly the "modules exist
// but don't talk to each other" class of bug the sync layer was built
// to stop happening at the data layer.
const ATTACHMENT_TYPES = {
  IMAGE: "image",
  DOCUMENT: "document",
  VOICE_NOTE: "voice_note",
  VIDEO: "video"
};
const ATTACHMENT_TYPE_VALUES = Object.values(ATTACHMENT_TYPES);

const LIMITS = {
  MESSAGE_TEXT_MAX: 2000,
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
  MAX_PARTICIPANTS_DIRECT: 2, // community/group sizing is a future concern
  // Client-reported duration for voice/video attachments. This is
  // trusted metadata (the server doesn't probe the file), so it's just
  // a sanity ceiling, not a real media-duration validation.
  MAX_ATTACHMENT_DURATION_SECONDS: 600
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 30, // messages list defaults higher than list-style resources
  MAX_LIMIT: 100
};

module.exports = {
  CONVERSATION_TYPES,
  CONVERSATION_TYPE_VALUES,
  CONVERSATION_STATUS,
  CONVERSATION_STATUS_VALUES,
  MESSAGE_TYPES,
  MESSAGE_TYPE_VALUES,
  MESSAGE_STATUS,
  MESSAGE_STATUS_VALUES,
  ATTACHMENT_TYPES,
  ATTACHMENT_TYPE_VALUES,
  LIMITS,
  PAGINATION
};