// backend/src/modules/feed/services/feedEventInjector.js
//
// NEW FILE (Phase 1 follow-up — Feed integration). Exact same
// pull-pattern feedCommunityInjector.js established and
// feedLearningInjector.js/feedRecommendationInjector.js already follow:
// Feed reads FROM Events, Events never pushes INTO Feed, no new
// event-bus. Closes the gap flagged in the phased upgrade plan: "Events
// ke liye feedEventInjector.js jaisa kuch nahi hai — approved/live
// event automatically Feed card nahi banta."
//
// Structured closer to feedLearningInjector.js than
// feedCommunityInjector.js (try/catch + logger, fails silently) rather
// than the older un-guarded feedCommunityInjector.js shape — same
// non-negotiable discipline feedLearningInjector.js's header documents
// for itself: this enhances the feed, it must never be able to break
// it, and an Events query failure is exactly as recoverable (falling
// back to `posts` unchanged) as a Learning one.

const User = require("../../auth/models/User");
const Event = require("../../events/models/Event");
const { EVENT_STATUS } = require("../../events/constants/event.constants");
const logger = require("../../../shared/logger/logger");

const MAX_EVENT_CARDS = 2;         // same per-page cap every other injector uses
const INSERT_AFTER_EVERY = 5;      // between Community's 4 and Learning's 6 — events are timely but not as frequent as posts
const EVENT_POOL_SCAN_LIMIT = 30;
const UPCOMING_WINDOW_DAYS = 14;   // only surface events starting within the next 2 weeks — a 3-month-out event isn't "feed timely" yet

const toEventCard = (event) => ({
  isEvent: true,
  recommendationType: "event",
  _id: `event_${event._id}`,
  eventId: event._id,
  title: event.title,
  category: event.category,
  venue: event.venue,
  isVirtual: event.isVirtual,
  bannerUrl: event.bannerUrl,
  startTime: event.startTime,
  endTime: event.endTime,
  organizer: event.organizedBy,
  community: event.communityId
    ? { _id: event.communityId._id, name: event.communityId.name, slug: event.communityId.slug }
    : null,
  createdAt: event.createdAt
});

// Fails SILENTLY on any error — same discipline feedLearningInjector.js
// already documents for itself: this enhances the feed, it must never
// be able to break it.
const injectUpcomingEvents = async (posts, userId) => {
  try {
    const user = await User.findById(userId).select("role").lean();
    if (!user) return posts;

    const now = new Date();
    const until = new Date(now.getTime() + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const eventPool = await Event.find({
      status: { $in: [EVENT_STATUS.APPROVED, EVENT_STATUS.LIVE] },
      isDeleted: false,
      isArchived: false,
      startTime: { $gte: now, $lte: until },
      targetRoles: user.role
    })
      .sort({ startTime: 1 })
      .limit(EVENT_POOL_SCAN_LIMIT)
      .populate("organizedBy", "username role")
      .populate("communityId", "name slug")
      .lean();

    if (!eventPool.length) return posts;

    const picked = eventPool.slice(0, MAX_EVENT_CARDS);

    const result = [...posts];
    picked.map(toEventCard).forEach((card, index) => {
      const insertAt = Math.min((index + 1) * INSERT_AFTER_EVERY, result.length);
      result.splice(insertAt, 0, card);
    });

    return result;
  } catch (err) {
    logger.error(`[feedEventInjector] Failed to inject upcoming events: ${err.message}`);
    return posts;
  }
};

module.exports = { injectUpcomingEvents };