// backend/src/modules/mentorship/constants/mentor.constants.js
//
// UPDATED: added SESSION_STATUS.LIVE for the new scheduled → live →
// completed auto-transition lifecycle (via scheduleMentorSessionCron.js).
// SESSION_TERMINAL_STATUSES unchanged — "live" is NOT terminal, a session
// can still be cancelled or auto-completed while live.

const MENTOR_ELIGIBLE_ROLES = ["faculty", "alumni"];
const MENTORSHIP_REQUESTER_ROLES = ["student", "alumni"];

const MENTOR_STATUS = { ACTIVE: "active", INACTIVE: "inactive", SUSPENDED: "suspended" };
const MENTOR_STATUS_VALUES = Object.values(MENTOR_STATUS);

const VERIFICATION_STATUS = { PENDING: "pending", VERIFIED: "verified", REJECTED: "rejected" };
const VERIFICATION_STATUS_VALUES = Object.values(VERIFICATION_STATUS);

const PROFILE_VISIBILITY = { PUBLIC: "public", PRIVATE: "private" };
const PROFILE_VISIBILITY_VALUES = Object.values(PROFILE_VISIBILITY);

const REQUEST_STATUS = { PENDING: "pending", ACCEPTED: "accepted", REJECTED: "rejected", CANCELLED: "cancelled" };
const REQUEST_STATUS_VALUES = Object.values(REQUEST_STATUS);
const REQUEST_TERMINAL_STATUSES = [REQUEST_STATUS.REJECTED, REQUEST_STATUS.CANCELLED];
const CANCELLABLE_REQUEST_STATUSES = [REQUEST_STATUS.PENDING];

// NEW: LIVE inserted between SCHEDULED and COMPLETED. A session is
// "live" for the exact window [scheduledAt, endsAt) — set by the cron,
// never by a client request, since the client can't be trusted to know
// the current server time accurately.
const SESSION_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",           // NEW
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show"
};
const SESSION_STATUS_VALUES = Object.values(SESSION_STATUS);
const SESSION_TERMINAL_STATUSES = [SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED, SESSION_STATUS.NO_SHOW];

const AVAILABILITY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SESSION_DURATIONS = [30, 45, 60, 90];
const DEFAULT_SESSION_DURATION = 30;
const MEETING_MODES = ["online", "offline"];
const DEFAULT_MEETING_MODE = "online";
const SUPPORTED_LANGUAGES = ["english", "hindi", "bengali", "tamil", "telugu", "marathi"];
const EXPERTISE_DOMAINS = ["backend", "frontend", "ai", "ml", "cloud", "devops", "dsa", "placement", "resume-review", "interview", "research", "higher-studies", "open-source", "system-design"];
const MENTORSHIP_TOPICS = ["placement", "resume", "career", "interview", "projects", "research", "higher-studies", "coding", "hackathon"];

const LIMITS = {
  BIO_MIN: 10,
  BIO_MAX: 1000,
  TOPIC_MIN: 3,
  TOPIC_MAX: 100,
  MESSAGE_MIN: 10,
  MESSAGE_MAX: 1000,
  REJECTION_REASON_MAX: 500,
  MEETING_NOTE_MAX: 500,
  MAX_DOMAINS: 10,
  MAX_LANGUAGES: 6,
  YEARS_EXPERIENCE_MIN: 0,
  YEARS_EXPERIENCE_MAX: 50,
  REVIEW_FEEDBACK_MAX: 500
};

const RATING = { MIN: 0, MAX: 5, DEFAULT: 0 };
const PAGINATION = { DEFAULT_PAGE: 1, DEFAULT_LIMIT: 10, MAX_LIMIT: 50 };

const NOTIFICATION_EVENTS = {
  REQUEST_CREATED: "mentorship.request.created",
  REQUEST_ACCEPTED: "mentorship.request.accepted",
  REQUEST_REJECTED: "mentorship.request.rejected",
  SESSION_SCHEDULED: "mentorship.session.scheduled",
  SESSION_COMPLETED: "mentorship.session.completed",
  REVIEW_RECEIVED: "mentorship.review.received"
};

const ANALYTICS_KEYS = { ACCEPTANCE_RATE: "acceptanceRate", RESPONSE_TIME: "responseTime" };

module.exports = {
  MENTOR_ELIGIBLE_ROLES,
  MENTORSHIP_REQUESTER_ROLES,
  MENTOR_STATUS,
  MENTOR_STATUS_VALUES,
  VERIFICATION_STATUS,
  VERIFICATION_STATUS_VALUES,
  PROFILE_VISIBILITY,
  PROFILE_VISIBILITY_VALUES,
  REQUEST_STATUS,
  REQUEST_STATUS_VALUES,
  REQUEST_TERMINAL_STATUSES,
  CANCELLABLE_REQUEST_STATUSES,
  SESSION_STATUS,
  SESSION_STATUS_VALUES,
  SESSION_TERMINAL_STATUSES,
  AVAILABILITY_DAYS,
  SESSION_DURATIONS,
  DEFAULT_SESSION_DURATION,
  MEETING_MODES,
  DEFAULT_MEETING_MODE,
  SUPPORTED_LANGUAGES,
  EXPERTISE_DOMAINS,
  MENTORSHIP_TOPICS,
  LIMITS,
  RATING,
  PAGINATION,
  NOTIFICATION_EVENTS,
  ANALYTICS_KEYS
};