// backend/src/modules/communication/models/Conversation.js
//
// UPDATED: two changes to support Communities module —
//   1. participants validator now allows an empty array when type==="community"
//      (community access is resolved via CommunityMember collection, not
//      this array — required>=2 rule still applies to direct/mentorship chats)
//   2. communityId field added — back-reference from Conversation to
//      Community, was previously silently dropped by Mongoose strict mode.

const mongoose = require("mongoose");
const {
  CONVERSATION_TYPE_VALUES,
  CONVERSATION_STATUS,
  CONVERSATION_STATUS_VALUES
} = require("../constants/communication.constants");

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: CONVERSATION_TYPE_VALUES,
      required: true,
      index: true
    },
    // Stored as ObjectId refs. For type==="community", this stays an
    // empty array by design — access is resolved via CommunityMember
    // lookups (canCommunicate.js), never via this array, so it never
    // grows unbounded even at 500-member communities.
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
      validate: {
        validator: function (arr) {
          if (this.type === "community") return true;
          return arr.length >= 2;
        },
        message: "A conversation needs at least 2 participants"
      }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // NEW — back-reference for community-type conversations. null for
    // direct/mentorship conversations. Indexed so community.service.js's
    // future "find conversation by community" lookups stay fast.
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", default: null, index: true },

    status: {
      type: String,
      enum: CONVERSATION_STATUS_VALUES,
      default: CONVERSATION_STATUS.ACTIVE,
      index: true
    },
    archivedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], default: [] },

    // Denormalized preview fields — avoids a join/lookup just to render
    // an inbox list. Updated by message.service.js on every send.
    lastMessageText: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: null },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true, versionKey: false }
);

// Lets getOrCreateDirectConversation() find an existing 2-person
// conversation of a given type quickly via $all/$size matching.
conversationSchema.index({ type: 1, participants: 1 });
conversationSchema.index({ participants: 1, lastMessageAt: -1 }); // inbox sort

module.exports = mongoose.model("Conversation", conversationSchema);