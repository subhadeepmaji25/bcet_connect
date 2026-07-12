// backend/src/modules/notification/constants/notification.constants.js
//
// UPDATED (Phase 2 — Events career lifecycle): Added the three
// NOTIFICATION_EVENTS keys the Events services already call but that
// were missing here — EVENT_ATTENDANCE_MARKED (eventAttendance.service.js),
// EVENT_CERTIFICATE_ISSUED (eventCertificate.service.js), and
// EVENT_FEEDBACK_RECEIVED (eventFeedback.service.js). Without these keys,
// each of those notify() calls was silently no-op'd by notify()'s
// NOTIFICATION_EVENT_VALUES.includes(event) guard — same failure mode
// the six RESOURCE_* keys and SUBJECT_DISCUSSION_ANSWERED had before
// they were first added here. Confirmed via grep against
// modules/events/services/*.js — these three were the only remaining
// gaps between what Events fires and what this file recognizes.
//
// UPDATED (Phase 1 follow-up — Reminder cron): Added EVENT_REMINDER,
// fired by the new sendEventReminders() in event.service.js (called
// from core/scheduleEventLifecycleCron.js's per-minute tick). This was
// the last gap flagged in the phased upgrade plan — "no reminder cron
// (24h/2h/before-event notifications)". One event key covers both the
// 24h and 2h reminder, distinguished at send time via the
// {{hoursRemaining}} template variable — a second key wasn't needed
// since the category/type/priority/actionType are identical for both.

const NOTIFICATION_EVENTS = Object.freeze({
  USER_REGISTERED: "auth.user.registered",
  PASSWORD_CHANGED: "auth.password.changed",
  PROFILE_COMPLETED: "profile.completed",
  RESUME_UPLOADED: "resume.uploaded",
  RESUME_PARSE_FAILED: "resume.parse.failed",
  JOB_APPROVED: "job.approved",
  JOB_REJECTED: "job.rejected",
  JOB_CLOSED: "job.closed",
  JOB_EXPIRED: "job.expired",
  APPLICATION_RECEIVED: "job.application.received",
  APPLICATION_REVIEWED: "job.application.reviewed",
  CONNECTION_REQUEST_CREATED: "connection.request.created",
  CONNECTION_REQUEST_ACCEPTED: "connection.request.accepted",
  CONNECTION_REQUEST_REJECTED: "connection.request.rejected",
  MENTOR_REQUEST_CREATED: "mentorship.request.created",
  MENTOR_REQUEST_ACCEPTED: "mentorship.request.accepted",
  MENTOR_REQUEST_REJECTED: "mentorship.request.rejected",
  MENTOR_SESSION_SCHEDULED: "mentorship.session.scheduled",
  MENTOR_SESSION_COMPLETED: "mentorship.session.completed",
  MENTOR_REVIEW_RECEIVED: "mentorship.review.received",
  MESSAGE_RECEIVED: "communication.message.received",
  SYSTEM_ANNOUNCEMENT: "system.announcement",
  COMMUNITY_MEMBER_JOINED: "community.member.joined",
  COMMUNITY_ROLE_CHANGED: "community.role.changed",
  COMMUNITY_MEMBER_REMOVED: "community.member.removed",
  COMMUNITY_JOIN_REQUEST_CREATED: "community.join_request.created",
  COMMUNITY_JOIN_REQUEST_APPROVED: "community.join_request.approved",
  COMMUNITY_JOIN_REQUEST_REJECTED: "community.join_request.rejected",
  MENTIONED: "community.post.mentioned",
  COMMUNITY_COMMENT_RECEIVED: "community.comment.received",
  COMMUNITY_ANNOUNCEMENT: "community.post.announcement",
  // Feed module (Phase 1)
  FEED_MENTIONED: "feed.post.mentioned",
  FEED_COMMENT_RECEIVED: "feed.comment.received",
  FEED_POST_LIKED: "feed.post.liked",
  FEED_CONTENT_REPORTED: "feed.content.reported",
  FEED_REPORT_RESOLVED: "feed.report.resolved",
  // Events module (Phase 1 — approval / registration lifecycle)
  EVENT_APPROVED: "event.approved",
  EVENT_REJECTED: "event.rejected",
  EVENT_CANCELLED: "event.cancelled",
  EVENT_COMPLETED: "event.completed",
  EVENT_REGISTRATION_CONFIRMED: "event.registration.confirmed",
  EVENT_REGISTRATION_WAITLISTED: "event.registration.waitlisted",
  // Events module (Phase 2 — career lifecycle: attendance / certificate /
  // feedback). Values follow the same "<domain>.<entity>.<action>"
  // convention as every other key above and as shared/events/eventNames.js
  // documents. Added here because eventAttendance.service.js,
  // eventCertificate.service.js, and eventFeedback.service.js already
  // call notify() with these — this addition makes those calls resolve
  // to a real string instead of `undefined`.
  EVENT_ATTENDANCE_MARKED: "event.attendance.marked",
  EVENT_CERTIFICATE_ISSUED: "event.certificate.issued",
  EVENT_FEEDBACK_RECEIVED: "event.feedback.received",
  // Events module (Phase 1 follow-up — reminder cron). Fired for both
  // the 24h-before and 2h-before reminder ticks; see EVENT_METADATA
  // below and sendEventReminders() in event.service.js.
  EVENT_REMINDER: "event.reminder",
  // Learning module (Academic Learning + Engagement, Phase 1 & 3)
  RESOURCE_PUBLISHED: "learning.resource.published",
  RESOURCE_PENDING_VERIFICATION: "learning.resource.pending",
  RESOURCE_VERIFIED: "learning.resource.verified",
  RESOURCE_REJECTED: "learning.resource.rejected",
  RESOURCE_RATED: "learning.resource.rated",
  RESOURCE_COMMENT_RECEIVED: "learning.resource.comment.received",
  // NEW (Phase 2b) — Learning module (Subject Discussion / Q&A)
  // Dedicated event for "someone answered your question" — deliberately
  // separate from RESOURCE_COMMENT_RECEIVED above, since a Subject
  // Discussion answer and a Resource comment are two different surfaces
  // (subjectDiscussion.service.js vs resourceEngagement.service.js),
  // same "don't merge, keep parallel" restraint those two services
  // already keep from each other at the model/service layer.
  SUBJECT_DISCUSSION_ANSWERED: "learning.discussion.answered"
});

const NOTIFICATION_EVENT_VALUES = Object.freeze(Object.values(NOTIFICATION_EVENTS));

const NOTIFICATION_CATEGORY = Object.freeze({
  AUTH: "AUTH",
  PROFILE: "PROFILE",
  JOB: "JOB",
  APPLICATION: "APPLICATION",
  MENTORSHIP: "MENTORSHIP",
  CONNECTION: "CONNECTION",
  COMMUNICATION: "COMMUNICATION",
  SYSTEM: "SYSTEM",
  COMMUNITY: "COMMUNITY",
  // Feed module (Phase 1)
  FEED: "FEED",
  // Events module (Phase 1)
  EVENT: "EVENT",
  // Learning module
  LEARNING: "LEARNING"
});

const NOTIFICATION_CATEGORY_VALUES = Object.freeze(Object.values(NOTIFICATION_CATEGORY));

const NOTIFICATION_TYPE = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error"
});

const NOTIFICATION_TYPE_VALUES = Object.freeze(Object.values(NOTIFICATION_TYPE));

const NOTIFICATION_PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  CRITICAL: "critical"
});

const NOTIFICATION_PRIORITY_VALUES = Object.freeze(Object.values(NOTIFICATION_PRIORITY));

const DELIVERY_CHANNEL = Object.freeze({
  DATABASE: "database",
  EMAIL: "email",
  PUSH: "push",
  SOCKET: "socket"
});

const NOTIFICATION_STATUS = Object.freeze({
  UNREAD: "unread",
  READ: "read",
  ARCHIVED: "archived"
});

const NOTIFICATION_STATUS_VALUES = Object.freeze(Object.values(NOTIFICATION_STATUS));

const ACTION_TYPE = Object.freeze({
  OPEN_JOB: "OPEN_JOB",
  OPEN_PROFILE: "OPEN_PROFILE",
  OPEN_CHAT: "OPEN_CHAT",
  OPEN_MENTORSHIP: "OPEN_MENTORSHIP",
  OPEN_CONNECTION: "OPEN_CONNECTION",
  OPEN_NOTIFICATION: "OPEN_NOTIFICATION",
  OPEN_COMMUNITY: "OPEN_COMMUNITY",
  // Feed module (Phase 1)
  OPEN_FEED_POST: "OPEN_FEED_POST",
  // Events module (Phase 1)
  OPEN_EVENT: "OPEN_EVENT",
  // Learning module
  OPEN_LEARNING_RESOURCE: "OPEN_LEARNING_RESOURCE"
});

const CATEGORY_ICON_MAP = Object.freeze({
  [NOTIFICATION_CATEGORY.AUTH]: "shield",
  [NOTIFICATION_CATEGORY.PROFILE]: "user",
  [NOTIFICATION_CATEGORY.JOB]: "briefcase",
  [NOTIFICATION_CATEGORY.APPLICATION]: "file-text",
  [NOTIFICATION_CATEGORY.MENTORSHIP]: "graduation-cap",
  [NOTIFICATION_CATEGORY.CONNECTION]: "users",
  [NOTIFICATION_CATEGORY.COMMUNICATION]: "message-circle",
  [NOTIFICATION_CATEGORY.SYSTEM]: "bell",
  [NOTIFICATION_CATEGORY.COMMUNITY]: "users-round",
  // Feed module (Phase 1)
  [NOTIFICATION_CATEGORY.FEED]: "rss",
  // Events module (Phase 1)
  [NOTIFICATION_CATEGORY.EVENT]: "calendar",
  // Learning module
  [NOTIFICATION_CATEGORY.LEARNING]: "book-open"
});

const EVENT_METADATA = Object.freeze({
  [NOTIFICATION_EVENTS.USER_REGISTERED]: {
    category: NOTIFICATION_CATEGORY.AUTH,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_PROFILE,
    titleTemplate: "Welcome to BCET Connect",
    bodyTemplate: "Your account has been created. Complete your profile to get started."
  },
  [NOTIFICATION_EVENTS.PASSWORD_CHANGED]: {
    category: NOTIFICATION_CATEGORY.AUTH,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.CRITICAL,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "Password changed",
    bodyTemplate: "Your account password was changed. If this wasn't you, contact support immediately."
  },
  [NOTIFICATION_EVENTS.PROFILE_COMPLETED]: {
    category: NOTIFICATION_CATEGORY.PROFILE,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_PROFILE,
    titleTemplate: "Profile complete",
    bodyTemplate: "Your profile is now 100% complete. Recommendations are fully unlocked."
  },
  [NOTIFICATION_EVENTS.RESUME_UPLOADED]: {
    category: NOTIFICATION_CATEGORY.PROFILE,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_PROFILE,
    titleTemplate: "Resume uploaded",
    bodyTemplate: "Your resume was uploaded and skills were extracted successfully."
  },
  [NOTIFICATION_EVENTS.RESUME_PARSE_FAILED]: {
    category: NOTIFICATION_CATEGORY.PROFILE,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_PROFILE,
    titleTemplate: "Resume parsing failed",
    bodyTemplate: "We couldn't extract skills from your resume automatically. You can add skills manually."
  },
  [NOTIFICATION_EVENTS.JOB_APPROVED]: {
    category: NOTIFICATION_CATEGORY.JOB,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "Job approved",
    bodyTemplate: 'Your job posting "{{jobTitle}}" has been approved and is now live.'
  },
  [NOTIFICATION_EVENTS.JOB_REJECTED]: {
    category: NOTIFICATION_CATEGORY.JOB,
    type: NOTIFICATION_TYPE.ERROR,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "Job rejected",
    bodyTemplate: 'Your job posting "{{jobTitle}}" was rejected.'
  },
  [NOTIFICATION_EVENTS.JOB_CLOSED]: {
    category: NOTIFICATION_CATEGORY.JOB,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "Job closed",
    bodyTemplate: 'The job "{{jobTitle}}" has been closed.'
  },
  [NOTIFICATION_EVENTS.JOB_EXPIRED]: {
    category: NOTIFICATION_CATEGORY.JOB,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "Job expired",
    bodyTemplate: 'The job "{{jobTitle}}" has expired and was automatically closed.'
  },
  [NOTIFICATION_EVENTS.APPLICATION_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.APPLICATION,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "New application received",
    bodyTemplate: '{{applicantName}} applied to "{{jobTitle}}".'
  },
  [NOTIFICATION_EVENTS.APPLICATION_REVIEWED]: {
    category: NOTIFICATION_CATEGORY.APPLICATION,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_JOB,
    titleTemplate: "Application update",
    bodyTemplate: 'Your application to "{{jobTitle}}" was marked as {{status}}.'
  },
  [NOTIFICATION_EVENTS.CONNECTION_REQUEST_CREATED]: {
    category: NOTIFICATION_CATEGORY.CONNECTION,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_CONNECTION,
    titleTemplate: "New connection request",
    bodyTemplate: "{{requesterName}} sent you a connection request."
  },
  [NOTIFICATION_EVENTS.CONNECTION_REQUEST_ACCEPTED]: {
    category: NOTIFICATION_CATEGORY.CONNECTION,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_CONNECTION,
    titleTemplate: "Connection accepted",
    bodyTemplate: "{{receiverName}} accepted your connection request. You can now message each other."
  },
  [NOTIFICATION_EVENTS.CONNECTION_REQUEST_REJECTED]: {
    category: NOTIFICATION_CATEGORY.CONNECTION,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "Connection request declined",
    bodyTemplate: "Your connection request was declined."
  },
  [NOTIFICATION_EVENTS.MENTOR_REQUEST_CREATED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_MENTORSHIP,
    titleTemplate: "New mentorship request",
    bodyTemplate: "{{studentName}} requested mentorship from you on {{topic}}."
  },
  [NOTIFICATION_EVENTS.MENTOR_REQUEST_ACCEPTED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_MENTORSHIP,
    titleTemplate: "Mentorship accepted",
    bodyTemplate: "{{mentorName}} accepted your mentorship request. You can now message each other."
  },
  [NOTIFICATION_EVENTS.MENTOR_REQUEST_REJECTED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "Mentorship request declined",
    bodyTemplate: "Your mentorship request was declined."
  },
  [NOTIFICATION_EVENTS.MENTOR_SESSION_SCHEDULED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_MENTORSHIP,
    titleTemplate: "Session scheduled",
    bodyTemplate: "Your mentorship session on {{topic}} is scheduled for {{scheduledAtLabel}}."
  },
  [NOTIFICATION_EVENTS.MENTOR_SESSION_COMPLETED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_MENTORSHIP,
    titleTemplate: "Session completed",
    bodyTemplate: "Your session with {{mentorName}} is marked complete. Leave a review to help other students."
  },
  [NOTIFICATION_EVENTS.MENTOR_REVIEW_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.MENTORSHIP,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_MENTORSHIP,
    titleTemplate: "New review received",
    bodyTemplate: "{{studentName}} left you a {{rating}}-star review."
  },
  [NOTIFICATION_EVENTS.MESSAGE_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.COMMUNICATION,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_CHAT,
    titleTemplate: "New message",
    bodyTemplate: "{{senderName}} sent you a message."
  },
  [NOTIFICATION_EVENTS.SYSTEM_ANNOUNCEMENT]: {
    category: NOTIFICATION_CATEGORY.SYSTEM,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "{{title}}",
    bodyTemplate: "{{body}}"
  },
  [NOTIFICATION_EVENTS.COMMUNITY_MEMBER_JOINED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "New member joined",
    bodyTemplate: "Someone joined your community."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_ROLE_CHANGED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "Your role was updated",
    bodyTemplate: "Your role in a community was changed to {{newRole}}."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_MEMBER_REMOVED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "Removed from community",
    bodyTemplate: "You were removed from a community."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_JOIN_REQUEST_CREATED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "New join request",
    bodyTemplate: "Someone requested to join your community."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_JOIN_REQUEST_APPROVED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "Join request approved",
    bodyTemplate: "Your request to join the community was approved."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_JOIN_REQUEST_REJECTED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_NOTIFICATION,
    titleTemplate: "Join request declined",
    bodyTemplate: "Your request to join the community was declined."
  },
  [NOTIFICATION_EVENTS.MENTIONED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "You were mentioned",
    bodyTemplate: "You were mentioned in a community post."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_COMMENT_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "New comment on your post",
    bodyTemplate: "{{commenterName}} commented on your post."
  },
  [NOTIFICATION_EVENTS.COMMUNITY_ANNOUNCEMENT]: {
    category: NOTIFICATION_CATEGORY.COMMUNITY,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_COMMUNITY,
    titleTemplate: "New announcement in {{communityName}}",
    bodyTemplate: "{{authorName}} posted an announcement."
  },
  // Feed module (Phase 1)
  [NOTIFICATION_EVENTS.FEED_MENTIONED]: {
    category: NOTIFICATION_CATEGORY.FEED,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_FEED_POST,
    titleTemplate: "You were mentioned",
    bodyTemplate: "{{authorName}} mentioned you in a post."
  },
  [NOTIFICATION_EVENTS.FEED_COMMENT_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.FEED,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_FEED_POST,
    titleTemplate: "New comment on your post",
    bodyTemplate: "{{commenterName}} commented on your post."
  },
  [NOTIFICATION_EVENTS.FEED_POST_LIKED]: {
    category: NOTIFICATION_CATEGORY.FEED,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_FEED_POST,
    titleTemplate: "Your post got a like",
    bodyTemplate: "{{likerName}} liked your post."
  },
  [NOTIFICATION_EVENTS.FEED_CONTENT_REPORTED]: {
    category: NOTIFICATION_CATEGORY.FEED,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_FEED_POST,
    titleTemplate: "Feed content reported",
    bodyTemplate: "{{reporterName}} reported a {{targetType}}."
  },
  [NOTIFICATION_EVENTS.FEED_REPORT_RESOLVED]: {
    category: NOTIFICATION_CATEGORY.FEED,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_FEED_POST,
    titleTemplate: "Feed report resolved",
    bodyTemplate: "A feed report was marked {{status}}."
  },
  // Events module (Phase 1 — approval / registration lifecycle)
  [NOTIFICATION_EVENTS.EVENT_APPROVED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Event approved",
    bodyTemplate: 'Your event "{{eventTitle}}" has been approved and is now live.'
  },
  [NOTIFICATION_EVENTS.EVENT_REJECTED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.ERROR,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Event rejected",
    bodyTemplate: 'Your event "{{eventTitle}}" was rejected.'
  },
  [NOTIFICATION_EVENTS.EVENT_CANCELLED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.WARNING,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Event cancelled",
    bodyTemplate: 'The event "{{eventTitle}}" has been cancelled.'
  },
  [NOTIFICATION_EVENTS.EVENT_COMPLETED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Event completed",
    bodyTemplate: 'Your event "{{eventTitle}}" has ended.'
  },
  [NOTIFICATION_EVENTS.EVENT_REGISTRATION_CONFIRMED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Registration confirmed",
    bodyTemplate: 'You are registered for "{{eventTitle}}".'
  },
  [NOTIFICATION_EVENTS.EVENT_REGISTRATION_WAITLISTED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Added to waitlist",
    bodyTemplate: 'You are on the waitlist for "{{eventTitle}}".'
  },
  // Events module (Phase 2 — career lifecycle: attendance / certificate / feedback)
  [NOTIFICATION_EVENTS.EVENT_ATTENDANCE_MARKED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Attendance marked",
    bodyTemplate: 'Your attendance for "{{eventTitle}}" has been recorded.'
  },
  [NOTIFICATION_EVENTS.EVENT_CERTIFICATE_ISSUED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Certificate ready",
    bodyTemplate: 'Your certificate for "{{eventTitle}}" is ready to download.'
  },
  [NOTIFICATION_EVENTS.EVENT_FEEDBACK_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "New feedback received",
    bodyTemplate: '{{reviewerName}} left feedback on "{{eventTitle}}".'
  },
  // Events module (Phase 1 follow-up — reminder cron). {{hoursRemaining}}
  // is either 24 or 2 depending on which window fired — see
  // sendEventReminders() in event.service.js.
  [NOTIFICATION_EVENTS.EVENT_REMINDER]: {
    category: NOTIFICATION_CATEGORY.EVENT,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.HIGH,
    actionType: ACTION_TYPE.OPEN_EVENT,
    titleTemplate: "Upcoming event reminder",
    bodyTemplate: '"{{eventTitle}}" starts in {{hoursRemaining}} hours.'
  },
  // Learning module (Academic Learning + Engagement)
  [NOTIFICATION_EVENTS.RESOURCE_PUBLISHED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "New resource published",
    bodyTemplate: 'A new resource "{{resourceTitle}}" was published for {{subjectName}}.'
  },
  [NOTIFICATION_EVENTS.RESOURCE_PENDING_VERIFICATION]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "Resource awaiting verification",
    bodyTemplate: 'A CR uploaded "{{resourceTitle}}" for {{subjectName}} — needs your review.'
  },
  [NOTIFICATION_EVENTS.RESOURCE_VERIFIED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "Resource verified",
    bodyTemplate: 'Your upload "{{resourceTitle}}" was verified and published.'
  },
  [NOTIFICATION_EVENTS.RESOURCE_REJECTED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.ERROR,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "Resource rejected",
    bodyTemplate: 'Your upload "{{resourceTitle}}" was rejected. Reason: {{rejectionReason}}'
  },
  [NOTIFICATION_EVENTS.RESOURCE_RATED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.LOW,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "New rating received",
    bodyTemplate: "{{raterName}} rated your resource {{rating}} stars."
  },
  [NOTIFICATION_EVENTS.RESOURCE_COMMENT_RECEIVED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.INFO,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "New comment on your resource",
    bodyTemplate: "{{commenterName}} commented on your resource."
  },
  // NEW (Phase 2b) — Learning module (Subject Discussion / Q&A)
  [NOTIFICATION_EVENTS.SUBJECT_DISCUSSION_ANSWERED]: {
    category: NOTIFICATION_CATEGORY.LEARNING,
    type: NOTIFICATION_TYPE.SUCCESS,
    priority: NOTIFICATION_PRIORITY.NORMAL,
    actionType: ACTION_TYPE.OPEN_LEARNING_RESOURCE,
    titleTemplate: "New answer to your question",
    bodyTemplate: "{{answererName}} answered your question."
  }
});

const EXPIRY_DAYS_BY_CATEGORY = Object.freeze({
  [NOTIFICATION_CATEGORY.AUTH]: 30,
  [NOTIFICATION_CATEGORY.PROFILE]: 60,
  [NOTIFICATION_CATEGORY.JOB]: 60,
  [NOTIFICATION_CATEGORY.APPLICATION]: 60,
  [NOTIFICATION_CATEGORY.MENTORSHIP]: 90,
  [NOTIFICATION_CATEGORY.CONNECTION]: 90,
  [NOTIFICATION_CATEGORY.COMMUNICATION]: 90,
  [NOTIFICATION_CATEGORY.SYSTEM]: 180,
  [NOTIFICATION_CATEGORY.COMMUNITY]: 60,
  // Feed module (Phase 1)
  [NOTIFICATION_CATEGORY.FEED]: 60,
  // Events module (Phase 1)
  [NOTIFICATION_CATEGORY.EVENT]: 60,
  // Learning module
  [NOTIFICATION_CATEGORY.LEARNING]: 60
});

const DEFAULT_EXPIRY_DAYS = 60;

const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
});

// Batch size used when broadcasting a single event (e.g. an
// announcement) to an entire member list, so a 500-member community
// doesn't fire 500 concurrent notify() calls in one Promise.all tick.
const BROADCAST_BATCH_SIZE = 50;

module.exports = {
  NOTIFICATION_EVENTS,
  NOTIFICATION_EVENT_VALUES,
  NOTIFICATION_CATEGORY,
  NOTIFICATION_CATEGORY_VALUES,
  NOTIFICATION_TYPE,
  NOTIFICATION_TYPE_VALUES,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_PRIORITY_VALUES,
  DELIVERY_CHANNEL,
  NOTIFICATION_STATUS,
  NOTIFICATION_STATUS_VALUES,
  ACTION_TYPE,
  CATEGORY_ICON_MAP,
  EVENT_METADATA,
  EXPIRY_DAYS_BY_CATEGORY,
  DEFAULT_EXPIRY_DAYS,
  PAGINATION,
  BROADCAST_BATCH_SIZE
};