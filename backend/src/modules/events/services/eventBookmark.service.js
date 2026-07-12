// backend/src/modules/events/services/eventBookmark.service.js
const Event = require("../models/Event");
const EventBookmark = require("../models/EventBookmark");
const ApiError = require("../../../shared/errors/ApiError");

// Single toggle endpoint rather than separate add/remove services — the
// caller doesn't need to know current state, it just says "flip it", same
// as most like/bookmark toggles elsewhere in the codebase. No notify()
// call here on purpose: bookmarking is a private, personal action with
// no other party who needs to know about it, unlike feedback/registration
// which always have an organizer on the other end.
const toggleBookmark = async (userId, eventId) => {
  const event = await Event.findOne({ _id: eventId, isDeleted: false }).select("_id").lean();
  if (!event) throw ApiError.notFound("Event not found");

  const existing = await EventBookmark.findOne({ userId, eventId });
  if (existing) {
    await existing.deleteOne();
    return { success: true, message: "Bookmark removed", data: { bookmarked: false } };
  }

  await EventBookmark.create({ userId, eventId });
  return { success: true, message: "Event bookmarked", data: { bookmarked: true } };
};

const getMyBookmarks = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [bookmarks, total] = await Promise.all([
    EventBookmark.find({ userId })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("eventId", "title startTime endTime venue status bannerUrl category")
      .lean(),
    EventBookmark.countDocuments({ userId })
  ]);

  // Bookmarked events that were later hard-deleted still leave a
  // bookmark row behind (deleteEvent() only soft-deletes, so this is
  // rare, but a populate() against a genuinely removed _id resolves to
  // null) — filtered out here so the client never has to null-check.
  const validBookmarks = bookmarks.filter((b) => b.eventId !== null);

  return { bookmarks: validBookmarks, pagination: { total, page: Number(page), limit: Number(limit) } };
};

module.exports = {
  toggleBookmark,
  getMyBookmarks
};