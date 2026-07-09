// backend/src/shared/security/rateLimiters.js

const rateLimit = require("express-rate-limit");

const createLimiter = (windowMinutes, max, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message
    }
  });

const loginLimiter = createLimiter(
  15,
  10,
  "Too many login attempts. Try again in 15 minutes."
);

const registerLimiter = createLimiter(
  60,
  5,
  "Too many registrations from this IP. Try again in 1 hour."
);

const passwordResetLimiter = createLimiter(
  15,
  5,
  "Too many password reset attempts. Try again in 15 minutes."
);

// Resume upload/replace — most expensive per-request route (disk write +
// PDF parse + Cloudinary push), so a tighter window than generic writes.
const uploadLimiter = createLimiter(
  60,
  10,
  "Too many uploads. Try again in 1 hour."
);

// Job create/apply — write-heavy, spammable if left unguarded.
const jobActionLimiter = createLimiter(
  60,
  20,
  "Too many job actions. Try again in 1 hour."
);

// Mentorship requests — student sending requests to mentors.
// Looser than login/register (legit use = a few requests/day),
// tight enough to stop spam-requesting every mentor on the platform.
const mentorshipRequestLimiter = createLimiter(
  60,
  15,
  "Too many mentorship requests. Try again in 1 hour."
);

// Connection (follow) requests — same reasoning as mentorship requests.
const connectionRequestLimiter = createLimiter(
  60,
  20,
  "Too many connection requests. Try again in 1 hour."
);

// Messages — the highest-frequency legitimate action in the whole app
// (real chat use = dozens/minute), so this is a per-minute limiter,
// not per-hour like the others. 20/min stops flooding while staying
// invisible to normal conversation pace.
const messageLimiter = createLimiter(
  1,
  20,
  "You're sending messages too fast. Please slow down."
);

// Community write actions — create community, join, create join-request,
// create post. Grouped under one limiter since all four are moderate-
// frequency, spammable-if-unguarded writes (same tier as job actions),
// not high-frequency like chat messages. A single member creating 20
// communities or posts in an hour is already abuse-level activity.
const communityActionLimiter = createLimiter(
  60,
  20,
  "Too many community actions. Try again in 1 hour."
);

// ── NEW ──────────────────────────────────────────────
// Feed write actions — create post, create comment. Same tier as
// communityActionLimiter (moderate-frequency, spammable-if-unguarded
// writes), slightly looser cap since a global feed with connections +
// comments naturally sees a bit more legitimate write volume per hour
// than a single community's action set.
const feedActionLimiter = createLimiter(
  60,
  30,
  "Too many feed actions. Try again in 1 hour."
);

// Feed read/moderation-adjacent actions aren't as expensive as writes,
// but they are easy spam surfaces if left completely open.
const feedInteractionLimiter = createLimiter(
  60,
  60,
  "Too many feed interactions. Try again in 1 hour."
);

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  uploadLimiter,
  jobActionLimiter,
  mentorshipRequestLimiter,
  connectionRequestLimiter,
  messageLimiter,
  communityActionLimiter,
  feedActionLimiter,
  feedInteractionLimiter
};
