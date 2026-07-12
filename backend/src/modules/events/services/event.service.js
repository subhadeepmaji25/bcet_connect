// backend/src/modules/events/services/event.service.js
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { EVENT_STATUS, ORGANIZER_ROLES, ARCHIVE_AFTER_DAYS } = require("../constants/event.constants");

// ── Reminder cron config ───────────────────────────────────────────────
// Two fixed windows, matching the phased-upgrade requirement
// ("24h/2h/before-event notifications"). Each window is exactly 1
// minute wide because scheduleEventLifecycleCron.js ticks every
// minute — this guarantees the window is hit exactly once per event
// per cron restart-safety pass, same minute-granularity reasoning the
// EVENT_STATUS_VALUES comment in event.constants.js already documents
// for startTime/endTime. `field` is the per-event Event.<field>
// timestamp that gates re-sending (see Event.js reminder24hSentAt /
// reminder2hSentAt) — a stored-per-document gate, not a stored-per-
// process one, since (unlike archiveOldEvents' single daily run) many
// different events can each need their own reminder at their own time.
const REMINDER_WINDOWS = Object.freeze([
  { hoursBefore: 24, field: "reminder24hSentAt" },
  { hoursBefore: 2, field: "reminder2hSentAt" }
]);

// Community module dependency is intentionally read-only and narrow:
// Events never writes to Community/CommunityMember, it only asks
// "is this user allowed to create an event for this community". Same
// one-directional-read discipline Recommendation already uses against
// SearchProfile — see the module dependency graph in the architecture
// audit docs.
const CommunityMember = require("../../communities/models/CommunityMember");
// NOTE: community.constants.js exports ROLE_PERMISSIONS but the
// hasPermission() helper itself lives inside communityMember.service.js
// and is not exported from there. Rather than import a service-internal
// helper across module boundaries, Events re-derives the same check
// locally from the exported ROLE_PERMISSIONS map — same data, no
// cross-module coupling to another module's service file.
const { ROLE_PERMISSIONS } = require("../../communities/constants/community.constants");
const communityMemberHasPermission = (role, action) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("*") || permissions.includes(action);
};

const ALLOWED_UPDATE_FIELDS = [
  "title", "description", "category", "tags", "venue", "isVirtual", "meetingLink",
  "startTime", "endTime", "registrationDeadline", "capacity", "bannerUrl",
  "attachments", "targetRoles"
];

// ── Permission gate for community-scoped events ──────────────────────
// Only reached when payload.communityId is present. Platform-wide events
// (communityId absent) only need ORGANIZER_ROLES, checked in createEvent.
const assertCanCreateForCommunity = async (userId, communityId) => {
  const member = await CommunityMember.findOne({ communityId, userId });
  if (!member) {
    throw ApiError.forbidden("You must be a member of this community to create an event for it");
  }
  if (!communityMemberHasPermission(member.role, "manage_feed")) {
    // Reuses the existing "manage_feed" permission rather than requiring
    // a new "manage_events" entry in community.constants.js — same roles
    // (owner/leader/co-leader) that manage a community's feed are the
    // right roles to gate its events behind. See PATCH-NOTES.md if you'd
    // rather add a dedicated "manage_events" permission later.
    throw ApiError.forbidden("Only community owners, leaders, or co-leaders can create events for this community");
  }
};

const createEvent = async (userId, userRole, payload) => {
  const { communityId } = payload;

  if (communityId) {
    await assertCanCreateForCommunity(userId, communityId);
  } else if (!ORGANIZER_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty, alumni, or admin can create platform events");
  }

  if (new Date(payload.endTime) <= new Date(payload.startTime)) {
    throw ApiError.badRequest("endTime must be after startTime");
  }

  const event = await Event.create({
    ...payload,
    organizedBy: userId,
    organizerRole: communityId ? "community-leader" : userRole,
    status: userRole === "admin" ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING,
    approvedBy: userRole === "admin" ? userId : null,
    approvedAt: userRole === "admin" ? new Date() : null
  });

  return {
    success: true,
    message: userRole === "admin" ? "Event created and approved" : "Event submitted for admin approval",
    data: { event }
  };
};

const updateEvent = async (eventId, userId, payload) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.organizedBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("You can only edit your own events");
  }
  if ([EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE, EVENT_STATUS.COMPLETED].includes(event.status)) {
    throw ApiError.badRequest(`Events cannot be edited once ${event.status}. Cancel and recreate instead.`);
  }

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) event[field] = payload[field];
  });

  if (payload.startTime || payload.endTime) {
    const nextStart = new Date(payload.startTime || event.startTime);
    const nextEnd = new Date(payload.endTime || event.endTime);
    if (nextEnd <= nextStart) throw ApiError.badRequest("endTime must be after startTime");
  }

  // Same re-submission pattern as Job.updateJob — editing a rejected
  // event sends it back into the approval queue instead of silently
  // staying rejected forever.
  if (event.status === EVENT_STATUS.REJECTED) {
    event.status = EVENT_STATUS.PENDING;
    event.rejectedBy = null;
    event.rejectedAt = null;
    event.rejectionReason = "";
  }

  await event.save();
  return { success: true, message: "Event updated successfully", data: { event } };
};

const deleteEvent = async (eventId, userId, userRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot delete this event");
  }
  event.isDeleted = true;
  event.deletedAt = new Date();
  await event.save();
  return { success: true, message: "Event deleted successfully", data: null };
};

const approveEvent = async (eventId, adminId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== EVENT_STATUS.PENDING) {
    throw ApiError.badRequest(`Event is already ${event.status}`);
  }
  event.status = EVENT_STATUS.APPROVED;
  event.approvedBy = adminId;
  event.approvedAt = new Date();
  await event.save();

  await notify(NOTIFICATION_EVENTS.EVENT_APPROVED, {
    userId: event.organizedBy,
    data: { eventTitle: event.title },
    meta: { eventId: event._id }
  });

  return { success: true, message: "Event approved successfully", data: { event } };
};

const rejectEvent = async (eventId, adminId, rejectionReason) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");
  if (event.status !== EVENT_STATUS.PENDING) {
    throw ApiError.badRequest(`Event is already ${event.status}`);
  }
  event.status = EVENT_STATUS.REJECTED;
  event.rejectedBy = adminId;
  event.rejectedAt = new Date();
  event.rejectionReason = rejectionReason;
  await event.save();

  await notify(NOTIFICATION_EVENTS.EVENT_REJECTED, {
    userId: event.organizedBy,
    data: { eventTitle: event.title },
    meta: { eventId: event._id }
  });

  return { success: true, message: "Event rejected", data: { event } };
};

const cancelEvent = async (eventId, userId, userRole, cancelReason = "") => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot cancel this event");
  }
  if (![EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE].includes(event.status)) {
    throw ApiError.badRequest(`Only approved or live events can be cancelled (current status: ${event.status})`);
  }
  event.status = EVENT_STATUS.CANCELLED;
  event.cancelledBy = userId;
  event.cancelledAt = new Date();
  event.cancelReason = cancelReason;
  await event.save();

  // Notify every confirmed/waitlisted registrant, not just the organizer
  // — this is the one place Events broadcasts to a list instead of a
  // single user, same batching-by-Promise.all pattern community.service
  // already uses for announcements (BROADCAST_BATCH_SIZE not needed here
  // since event capacity is realistically far smaller than a community
  // member list, but the fire-and-forget notify() call is identical).
  const registrations = await EventRegistration.find({
    eventId: event._id,
    status: { $in: ["confirmed", "waitlisted"] }
  }).select("userId").lean();

  await Promise.all(
    registrations.map((reg) =>
      notify(NOTIFICATION_EVENTS.EVENT_CANCELLED, {
        userId: reg.userId,
        data: { eventTitle: event.title },
        meta: { eventId: event._id }
      })
    )
  );

  return { success: true, message: "Event cancelled successfully", data: { event } };
};

// ── Cron-consumed lifecycle transitions ───────────────────────────────
// Mirrors expireOverdueJobs() exactly: snapshot-then-bulk-update, never
// throws, safe to call every tick even when nothing needs transitioning.

const markEventsLive = async () => {
  const now = new Date();
  const result = await Event.updateMany(
    { status: EVENT_STATUS.APPROVED, startTime: { $lte: now }, isDeleted: false },
    { $set: { status: EVENT_STATUS.LIVE, liveAt: now } }
  );
  return result.modifiedCount;
};

const completeEvents = async () => {
  const now = new Date();

  // Snapshot before the bulk update — same reasoning as
  // expireOverdueJobs(): updateMany() doesn't return affected docs, and
  // organizedBy + title are needed to notify each organizer.
  const eventsToComplete = await Event.find({
    status: EVENT_STATUS.LIVE,
    endTime: { $lte: now },
    isDeleted: false
  }).select("organizedBy title").lean();

  const result = await Event.updateMany(
    { status: EVENT_STATUS.LIVE, endTime: { $lte: now }, isDeleted: false },
    { $set: { status: EVENT_STATUS.COMPLETED, completedAt: now } }
  );

  await Promise.all(
    eventsToComplete.map((event) =>
      notify(NOTIFICATION_EVENTS.EVENT_COMPLETED, {
        userId: event.organizedBy,
        data: { eventTitle: event.title },
        meta: { eventId: event._id }
      })
    )
  );

  return result.modifiedCount;
};

const archiveOldEvents = async () => {
  const cutoff = new Date(Date.now() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  const result = await Event.updateMany(
    { status: EVENT_STATUS.COMPLETED, completedAt: { $lte: cutoff }, isArchived: false },
    { $set: { isArchived: true, archivedAt: new Date() } }
  );
  return result.modifiedCount;
};

// Sends the 24h-before and 2h-before reminder to every confirmed
// registrant of an event whose startTime just entered that window.
// Called every minute from scheduleEventLifecycleCron.js's runTick(),
// same call site markEventsLive()/completeEvents() are already called
// from. Never throws — a bad reminder tick must not take down the
// live/completed transitions running alongside it in the same tick.
const sendEventReminders = async () => {
  const now = new Date();
  let totalNotified = 0;

  for (const window of REMINDER_WINDOWS) {
    const windowStart = new Date(now.getTime() + window.hoursBefore * 60 * 60 * 1000);
    const windowEnd = new Date(windowStart.getTime() + 60 * 1000); // 1-minute wide, matches the per-minute cron tick

    // LIVE is included alongside APPROVED so a 2h reminder still fires
    // for an event whose startTime already ticked it to LIVE in an
    // earlier pass this same minute (markEventsLive() runs first in
    // runTick(), before this function).
    const dueEvents = await Event.find({
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE] },
      isDeleted: false,
      startTime: { $gte: windowStart, $lt: windowEnd },
      [window.field]: null
    }).select("title startTime").lean();

    if (!dueEvents.length) continue;

    for (const event of dueEvents) {
      // Snapshot-then-notify-then-gate, same order completeEvents()
      // already follows: read the registrant list first, since
      // updateOne()'s below only needs to run once the notifications
      // have actually gone out.
      const registrations = await EventRegistration.find({
        eventId: event._id,
        status: "confirmed"
      }).select("userId").lean();

      if (registrations.length) {
        await Promise.all(
          registrations.map((reg) =>
            notify(NOTIFICATION_EVENTS.EVENT_REMINDER, {
              userId: reg.userId,
              data: { eventTitle: event.title, hoursRemaining: window.hoursBefore },
              meta: { eventId: event._id }
            })
          )
        );
        totalNotified += registrations.length;
      }

      // Gate set even when registrations.length === 0 — an event with
      // no registrants in this window should never be re-checked on
      // every subsequent tick for the rest of its life.
      await Event.updateOne({ _id: event._id }, { $set: { [window.field]: now } });
    }
  }

  return totalNotified;
};

// ── Reads ──────────────────────────────────────────────────────────────

const getApprovedEvents = async (filters = {}) => {
  const { q, category, communityId, tag, upcoming, page = 1, limit = 10 } = filters;
  const query = {
    status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE] },
    isDeleted: false,
    isArchived: false
  };
  if (q) {
    const regex = new RegExp(q.trim(), "i");
    query.$or = [{ title: regex }, { description: regex }, { venue: regex }, { tags: regex }];
  }
  if (category) query.category = category;
  if (communityId) query.communityId = communityId;
  if (tag) query.tags = new RegExp(tag.trim(), "i");
  if (upcoming === "true") query.startTime = { $gte: new Date() };

  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find(query).sort({ startTime: 1 }).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments(query)
  ]);
  return {
    events,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

const getPendingEvents = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find({ status: EVENT_STATUS.PENDING, isDeleted: false })
      .sort({ createdAt: 1 }).skip(skip).limit(Number(limit))
      .populate("organizedBy", "username email role").lean(),
    Event.countDocuments({ status: EVENT_STATUS.PENDING, isDeleted: false })
  ]);
  return { events, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getMyEvents = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [events, total] = await Promise.all([
    Event.find({ organizedBy: userId, isDeleted: false }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Event.countDocuments({ organizedBy: userId, isDeleted: false })
  ]);
  return { events, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getEventById = async (eventId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).populate("organizedBy", "username fullName role");
  if (!event) throw ApiError.notFound("Event not found");
  await Event.updateOne({ _id: eventId }, { $inc: { viewCount: 1 } });
  return event.toObject({ virtuals: true });
};

const getAnalytics = async (eventId, userId, userRole) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).lean();
  if (!event) throw ApiError.notFound("Event not found");
  const isOwner = event.organizedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("Not authorized to view analytics for this event");
  }
  const [confirmedCount, waitlistedCount, cancelledCount] = await Promise.all([
    EventRegistration.countDocuments({ eventId, status: "confirmed" }),
    EventRegistration.countDocuments({ eventId, status: "waitlisted" }),
    EventRegistration.countDocuments({ eventId, status: "cancelled" })
  ]);
  return {
    success: true,
    message: "Analytics fetched",
    data: {
      views: event.viewCount,
      confirmedCount,
      waitlistedCount,
      cancelledCount,
      capacity: event.capacity,
      fillRate: event.capacity ? Number(((confirmedCount / event.capacity) * 100).toFixed(2)) : null
    }
  };
};

module.exports = {
  createEvent, updateEvent, deleteEvent,
  approveEvent, rejectEvent, cancelEvent,
  markEventsLive, completeEvents, archiveOldEvents, sendEventReminders,
  getApprovedEvents, getPendingEvents, getMyEvents, getEventById,
  getAnalytics
};