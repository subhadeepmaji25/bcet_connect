// backend/src/modules/events/models/Event.js
const mongoose = require("mongoose");
const {
  EVENT_STATUS,
  EVENT_STATUS_VALUES,
  EVENT_CATEGORIES,
  AGENDA_MAX_ITEMS
} = require("../constants/event.constants");

const eventSchema = new mongoose.Schema(
  {
    organizedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organizerRole: { type: String, enum: ["faculty", "alumni", "admin", "community-leader"], required: true },

    // Present only when this event belongs to a community (Community
    // leader/co-leader created it from inside a community). null for a
    // platform-wide event created by faculty/alumni/admin directly.
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null, index: true },

    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, enum: EVENT_CATEGORIES, default: "workshop" },

    // search module reads this the same way it reads Job.requiredSkills —
    // plain lowercased tag array, no separate SearchDocument logic needed.
    tags: [{ type: String, trim: true, lowercase: true }],

    venue: { type: String, trim: true, default: "" },
    isVirtual: { type: Boolean, default: false },
    meetingLink: { type: String, trim: true, default: null, match: [/^https?:\/\/.+/, "Invalid meeting URL"] },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    registrationDeadline: { type: Date, default: null },

    // null = unlimited capacity, matching Job.deadline's null-means-open pattern
    capacity: { type: Number, min: 1, default: null },

    bannerUrl: { type: String, default: null },
    // Cloudinary public_id for bannerUrl — same reason Profile.avatarPublicId
    // exists alongside Profile.avatar: replaceMedia()/deleteMedia() need the
    // public_id to remove the old Cloudinary object, the secure_url alone
    // isn't enough to delete or overwrite it cleanly.
    bannerPublicId: { type: String, default: null },
    attachments: [{ type: String }], // Cloudinary URLs — same media.service.js pipeline as Resume

    // Embedded, not a separate collection — same "flat unless there's a
    // real reason to split" call as the rest of this schema (see
    // AGENDA_MAX_ITEMS comment in event.constants.js). `time` is a plain
    // display string ("10:00 AM") rather than a Date: agenda slots are
    // same-day, human-entered labels, not independently-schedulable
    // events — forcing a full Date per row would just mean re-picking
    // the same day 30 times for one event.
    agenda: {
      type: [
        {
          _id: false,
          time: { type: String, trim: true, maxlength: 20, default: "" },
          title: { type: String, required: true, trim: true, maxlength: 150 },
          description: { type: String, trim: true, maxlength: 1000, default: "" },
          speaker: { type: String, trim: true, maxlength: 150, default: "" }
        }
      ],
      default: [],
      validate: {
        validator: (items) => items.length <= AGENDA_MAX_ITEMS,
        message: `Agenda cannot have more than ${AGENDA_MAX_ITEMS} items`
      }
    },

    targetRoles: { type: [String], enum: ["student", "faculty", "alumni"], default: ["student", "alumni"] },

    status: { type: String, enum: EVENT_STATUS_VALUES, default: EVENT_STATUS.DRAFT, index: true },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: "" },

    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, trim: true, default: "" },

    liveAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // NEW (Phase 1 follow-up — reminder cron). Set once each reminder
    // window fires for this event, so sendEventReminders() in
    // event.service.js never double-sends across per-minute cron ticks
    // (same "gate a cron action behind a stored timestamp" idea
    // ARCHIVE_AFTER_DAYS's lastArchiveRunDate already uses, just stored
    // per-event instead of per-process since reminders are per-event).
    reminder24hSentAt: { type: Date, default: null },
    reminder2hSentAt: { type: Date, default: null },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date, default: null },

    registrationCount: { type: Number, default: 0 },
    waitlistCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

eventSchema.index({ status: 1, startTime: 1 });
eventSchema.index({ organizedBy: 1, status: 1 });
eventSchema.index({ communityId: 1, status: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ isDeleted: 1 });
eventSchema.index({ isArchived: 1 });
eventSchema.index({ title: "text", description: "text", venue: "text" });

// Same shape as Job.isOpen — computed, never stored, so it can never
// drift out of sync with capacity/deadline the way a stored boolean would.
eventSchema.virtual("isRegistrationOpen").get(function () {
  if (this.status !== EVENT_STATUS.APPROVED) return false;
  if (this.registrationDeadline && new Date() > new Date(this.registrationDeadline)) return false;
  if (new Date() > new Date(this.startTime)) return false;
  if (this.capacity !== null && this.registrationCount >= this.capacity) return false;
  return true;
});

eventSchema.set("toObject", { virtuals: true });
eventSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);