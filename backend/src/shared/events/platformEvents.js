// backend/src/shared/events/platformEvents.js
const { EventEmitter } = require("events");
const logger = require("../logger/logger");
class PlatformEventBus extends EventEmitter {}
const bus = new PlatformEventBus();
bus.setMaxListeners(50);
const emitPlatformEvent = (eventName, payload = {}) => {
  try {
    bus.emit(eventName, payload);
  } catch (error) {
    logger.error(`Platform event listener threw synchronously for "${eventName}"`, error);
  }
};
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