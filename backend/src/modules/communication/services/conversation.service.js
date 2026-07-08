// backend/src/modules/communication/services/conversation.service.js
const Conversation = require("../models/Conversation");
const ApiError = require("../../../shared/errors/ApiError");
const { canCommunicate } = require("../../../engines/communication-access");
const {
  CONVERSATION_TYPES,
  CONVERSATION_STATUS
} = require("../constants/communication.constants");

const isParticipant = (conversation, userId) =>
  conversation.participants.some((p) => p.toString() === userId.toString());

const getOrCreateConversation = async (userIdOne, userIdTwo, type = CONVERSATION_TYPES.DIRECT) => {
  const participants = [userIdOne.toString(), userIdTwo.toString()].sort();

  let conversation = await Conversation.findOne({
    type,
    participants: { $all: participants, $size: participants.length }
  });

  if (conversation) return conversation;

  conversation = await Conversation.create({
    type,
    participants,
    createdBy: userIdOne,
    status: CONVERSATION_STATUS.ACTIVE
  });

  return conversation;
};

const startConversation = async (requesterId, recipientId) => {
  if (requesterId.toString() === recipientId.toString()) {
    throw ApiError.badRequest("You cannot start a conversation with yourself");
  }

  const allowed = await canCommunicate(requesterId, recipientId);
  if (!allowed) {
    throw ApiError.forbidden("You are not connected with this user yet");
  }

  const conversation = await getOrCreateConversation(requesterId, recipientId, CONVERSATION_TYPES.DIRECT);
  return { success: true, message: "Conversation ready", data: { conversation } };
};

const getMyConversations = async (userId, { page = 1, limit = 20, type, status, includeArchived = false } = {}) => {
  // For normal users, their direct/mentorship chats are found via participants: userId.
  // But wait! For communities, the community chats are found via CommunityMember of that user.
  // Let's support both in getMyConversations so community chats appear in Inbox!
  const CommunityMember = require("../../communities/models/CommunityMember");
  const myCommunities = await CommunityMember.find({ userId }).select("communityId").lean();
  const communityIds = myCommunities.map(m => m.communityId);

  const filter = {
    $or: [
      { participants: userId },
      { type: "community", communityId: { $in: communityIds } }
    ]
  };

  if (type) filter.type = type;
  filter.status = status || CONVERSATION_STATUS.ACTIVE;
  if (String(includeArchived).toLowerCase() !== "true") {
    filter.archivedBy = { $ne: userId };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [conversations, total] = await Promise.all([
    Conversation.find(filter)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("participants", "username email role")
      .lean(),
    Conversation.countDocuments(filter)
  ]);

  return { conversations, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getConversationById = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId).populate(
    "participants",
    "username email role"
  );
  if (!conversation) throw ApiError.notFound("Conversation not found");
  
  if (conversation.type === "community") {
    const CommunityMember = require("../../communities/models/CommunityMember");
    const isMember = await CommunityMember.exists({ communityId: conversation.communityId, userId });
    if (!isMember) {
      throw ApiError.forbidden("You are not a member of this community");
    }
  } else if (!isParticipant(conversation, userId)) {
    throw ApiError.forbidden("You are not part of this conversation");
  }
  return { success: true, message: "Conversation fetched", data: { conversation } };
};

const archiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  
  if (conversation.type === "community") {
    const CommunityMember = require("../../communities/models/CommunityMember");
    const isMember = await CommunityMember.exists({ communityId: conversation.communityId, userId });
    if (!isMember) {
      throw ApiError.forbidden("You are not a member of this community");
    }
  } else if (!isParticipant(conversation, userId)) {
    throw ApiError.forbidden("You are not part of this conversation");
  }

  if (!conversation.archivedBy.some((id) => id.toString() === userId.toString())) {
    conversation.archivedBy.push(userId);
  }
  await conversation.save();

  return { success: true, message: "Conversation archived", data: null };
};

const unarchiveConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  
  if (conversation.type === "community") {
    const CommunityMember = require("../../communities/models/CommunityMember");
    const isMember = await CommunityMember.exists({ communityId: conversation.communityId, userId });
    if (!isMember) {
      throw ApiError.forbidden("You are not a member of this community");
    }
  } else if (!isParticipant(conversation, userId)) {
    throw ApiError.forbidden("You are not part of this conversation");
  }

  conversation.archivedBy = conversation.archivedBy.filter(
    (id) => id.toString() !== userId.toString()
  );
  await conversation.save();

  return { success: true, message: "Conversation unarchived", data: null };
};

const touchLastMessage = async (conversationId, senderId, previewText) => {
  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: {
        lastMessageText: previewText,
        lastMessageAt: new Date(),
        lastMessageSender: senderId
      }
    }
  );
};

const assertParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  
  if (conversation.type === "community") {
    const CommunityMember = require("../../communities/models/CommunityMember");
    const isMember = await CommunityMember.exists({ communityId: conversation.communityId, userId });
    if (!isMember) {
      throw ApiError.forbidden("You are not a member of this community");
    }
    return conversation;
  }

  if (!isParticipant(conversation, userId)) {
    throw ApiError.forbidden("You are not part of this conversation");
  }
  return conversation;
};

const closeConversationBetween = async (userIdOne, userIdTwo, type = CONVERSATION_TYPES.DIRECT) => {
  const participants = [userIdOne.toString(), userIdTwo.toString()].sort();

  const conversation = await Conversation.findOne({
    type,
    participants: { $all: participants, $size: participants.length }
  });

  if (!conversation) return null;

  conversation.status = CONVERSATION_STATUS.CLOSED;
  await conversation.save();

  return conversation;
};

module.exports = {
  getOrCreateConversation,
  startConversation,
  getMyConversations,
  getConversationById,
  archiveConversation,
  unarchiveConversation,
  touchLastMessage,
  assertParticipant,
  closeConversationBetween
};
