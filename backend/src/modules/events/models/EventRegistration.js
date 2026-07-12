// backend/src/modules/events/models/EventRegistration.js
const mongoose = require("mongoose");
const { REGISTRATION_STATUS, REGISTRATION_STATUS_VALUES } = require("../constants/event.constants");

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: REGISTRATION_STATUS_VALUES,
      default: REGISTRATION_STATUS.CONFIRMED,
      index: true
    },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

// One user can register for a given event only once — re-registering
// after cancelling reuses the same document instead of creating a
// second row (see registerForEvent() in eventRegistration.service.js).
eventRegistrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1, status: 1 });

module.exports = mongoose.model("EventRegistration", eventRegistrationSchema);
