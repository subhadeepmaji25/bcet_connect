// backend/src/shared/events/platformEvents.js
//
// Central in-process Event Bus for BCET Connect.
//
// Purpose: let one module (Jobs, Mentorship, Connections, Communication...)
// announce "this happened" without knowing who — if anyone — is listening.
// This is what lets a future Notification module (or Analytics, or an
// Audit Log later) be added without touching a single line of existing
// module code. Same spirit as syncUserIntelligence.js, opposite direction:
// sync PULLS work into one place by calling functions; this PUSHES a
// signal out and lets other places decide whether to react.
//
// Rules for using this file (these are the whole point — do not break them):
//   1. Emitting modules (job.service.js, mentor.service.js, etc.) NEVER
//      require a listener module directly. job.service.js must never do
//      `require("../../notification/...")`.
//   2. emitPlatformEvent() is fire-and-forget. It returns nothing meaningful
//      and the caller must not await it for business logic — the action
//      that triggered the event is already complete by the time it's called.
//   3. Only listener modules (future Notification, Analytics, Audit Log)
//      require this file to call registerSafeListener(...). Business
//      modules only ever call emitPlatformEvent(...).
//
// This file has zero dependency on Mongoose, Express, or any business
// module — exactly like shared/logger/logger.js — so it can be required
// from anywhere without ever creating a circular import.

const { EventEmitter } = require("events");
const logger = require("../logger/logger");

class PlatformEventBus extends EventEmitter {}

// Node's default max-listeners warning (10) is tuned for typical single-
// purpose emitters, not a shared platform bus where several independent
// modules (Notification today, Analytics/Audit Log later) all attach
// listeners to the same handful of events. Raised generously so it never
// fires a false warning as more listeners get added over time.
const bus = new PlatformEventBus();
bus.setMaxListeners(50);

/**
 * Emit a platform event. Fire-and-forget by design.
 *
 * Usage — from any module's service file, right after the action it
 * describes has already completed successfully:
 *
 *   const { emitPlatformEvent } = require("../../../shared/events/platformEvents");
 *   const EVENTS = require("../../../shared/events/eventNames");
 *
 *   const approveJob = async (jobId, adminId) => {
 *     const job = await Job.findByIdAndUpdate(jobId, { status: "approved" }, { new: true });
 *     emitPlatformEvent(EVENTS.JOB_APPROVED, { jobId: job._id, postedBy: job.postedBy });
 *     return job;
 *   };
 *
 * @param {string} eventName - one of the values exported by eventNames.js
 * @param {object} [payload] - plain data only (ids/primitives) — never a
 *                             full Mongoose document or class instance
 */
const emitPlatformEvent = (eventName, payload = {}) => {
  try {
    // EventEmitter#emit runs every registered listener synchronously,
    // one after another, in the same tick. If a listener is declared
    // `async (payload) => {...}`, the function returns a Promise
    // immediately and its actual async work happens after this try/catch
    // has already finished — so a rejected promise inside a listener
    // will NOT be caught here. That's exactly why registerSafeListener()
    // below exists: it wraps each handler's body so async failures are
    // caught at the source, not left as unhandled rejections.
    bus.emit(eventName, payload);
  } catch (error) {
    // A synchronous throw inside a listener must never take down the
    // module that emitted the event. Jobs/Mentorship/Connections/etc. do
    // not know or care who is listening, so a listener's bug is not their
    // bug — log it and move on.
    logger.error(`Platform event listener threw synchronously for "${eventName}"`, error);
  }
};

/**
 * Register a listener with automatic error containment. Use this instead
 * of bus.on(...) directly for any listener that does real work (DB writes,
 * etc.) — which is every real listener the Notification module will add.
 *
 * A throwing or rejecting handler is logged and swallowed here — it can
 * never crash the process, and it never affects the module that emitted
 * the event or any other listener attached to the same event.
 *
 * @param {string} eventName
 * @param {(payload: object) => Promise<void>|void} handler
 */
const registerSafeListener = (eventName, handler) => {
  bus.on(eventName, async (payload) => {
    try {
      await handler(payload);
    } catch (error) {
      logger.error(`Platform event handler failed for "${eventName}"`, error);
    }
  });
};

module.exports = {
  bus,                // exposed only for edge cases (e.g. tests) — prefer the two functions below
  emitPlatformEvent,
  registerSafeListener
};