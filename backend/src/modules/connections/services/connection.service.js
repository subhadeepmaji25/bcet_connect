// backend/src/modules/connections/services/connection.service.js
const ConnectionRequest = require("../models/ConnectionRequest");
const Connection = require("../models/Connection");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const {
  REQUEST_STATUS,
  CANCELLABLE_REQUEST_STATUSES,
  CONNECTION_STATUS,
  RELATIONSHIP_STATUS
} = require("../constants/connection.constants");
const conversationService = require("../../communication/services/conversation.service");
const { CONVERSATION_TYPES } = require("../../communication/constants/communication.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const logger = require("../../../shared/logger/logger");

const isActionable = (status) => status === REQUEST_STATUS.PENDING;
const isCancellable = (status) => CANCELLABLE_REQUEST_STATUSES.includes(status);

const canonicalizePair = (idOne, idTwo) => {
  const a = idOne.toString();
  const b = idTwo.toString();
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
};

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const ensureConversation = async (userIdOne, userIdTwo, context) => {
  try {
    return await conversationService.getOrCreateConversation(userIdOne, userIdTwo, CONVERSATION_TYPES.DIRECT);
  } catch (err) {
    logger.error("Failed to create direct conversation after connection accept", {
      module: "Connections",
      ...context,
      error: err.message
    });
    return null;
  }
};

const closeConversation = async (userIdOne, userIdTwo, context) => {
  try {
    return await conversationService.closeConversationBetween(userIdOne, userIdTwo, CONVERSATION_TYPES.DIRECT);
  } catch (err) {
    logger.error("Failed to close direct conversation after connection removal", {
      module: "Connections",
      ...context,
      error: err.message
    });
    return null;
  }
};

const sendRequest = async (requesterId, payload) => {
  const { receiverId } = payload;

  if (receiverId.toString() === requesterId.toString()) {
    throw ApiError.badRequest("You cannot send a connection request to yourself");
  }

  const { userA, userB } = canonicalizePair(requesterId, receiverId);
  const existingConnection = await Connection.findOne({ userA, userB, status: CONNECTION_STATUS.ACTIVE });
  if (existingConnection) throw ApiError.conflict("You are already connected with this user");

  const existingPending = await ConnectionRequest.findOne({
    status: REQUEST_STATUS.PENDING,
    $or: [{ requesterId, receiverId }, { requesterId: receiverId, receiverId: requesterId }]
  });
  if (existingPending) throw ApiError.conflict("A connection request already exists between you and this user");

  const request = await ConnectionRequest.create({
    requesterId,
    receiverId,
    ...payload,
    status: REQUEST_STATUS.PENDING,
    statusHistory: [{ status: REQUEST_STATUS.PENDING, changedBy: requesterId, note: "Request created" }]
  });

  const requesterName = await getUsernameSafe(requesterId);
  await notify(NOTIFICATION_EVENTS.CONNECTION_REQUEST_CREATED, {
    userId: receiverId,
    data: { requesterName },
    meta: { requestId: request._id }
  });

  return { success: true, message: "Connection request sent successfully", data: { request } };
};

const acceptRequest = async (requestId, receiverId) => {
  const request = await ConnectionRequest.findOne({ _id: requestId, receiverId });
  if (!request) throw ApiError.notFound("Request not found");
  if (!isActionable(request.status)) throw ApiError.badRequest(`Request is already ${request.status}`);

  request.status = REQUEST_STATUS.ACCEPTED;
  request.respondedAt = new Date();
  request.statusHistory.push({ status: REQUEST_STATUS.ACCEPTED, changedBy: receiverId, note: "Request accepted" });
  await request.save();

  const { userA, userB } = canonicalizePair(request.requesterId, request.receiverId);
  let connection;

  try {
    connection = await Connection.create({ userA, userB, status: CONNECTION_STATUS.ACTIVE });
  } catch (err) {
    if (err.code === 11000) {
      connection = await Connection.findOneAndUpdate(
        { userA, userB },
        { $set: { status: CONNECTION_STATUS.ACTIVE, removedBy: null, removedAt: null } },
        { new: true }
      );
    } else {
      throw err;
    }
  }

  const conversation = await ensureConversation(request.requesterId, request.receiverId, { requestId });
  const receiverName = await getUsernameSafe(receiverId);

  await notify(NOTIFICATION_EVENTS.CONNECTION_REQUEST_ACCEPTED, {
    userId: request.requesterId,
    data: { receiverName },
    meta: { requestId: request._id, connectionId: connection ? connection._id : null }
  });

  return { success: true, message: "Connection request accepted", data: { request, connection, conversation } };
};

const rejectRequest = async (requestId, receiverId, reason = "") => {
  const request = await ConnectionRequest.findOne({ _id: requestId, receiverId });
  if (!request) throw ApiError.notFound("Request not found");
  if (!isActionable(request.status)) throw ApiError.badRequest(`Request is already ${request.status}`);

  request.status = REQUEST_STATUS.REJECTED;
  request.respondedAt = new Date();
  request.rejectionReason = reason;
  request.statusHistory.push({ status: REQUEST_STATUS.REJECTED, changedBy: receiverId, note: reason || "Request rejected" });
  await request.save();

  await notify(NOTIFICATION_EVENTS.CONNECTION_REQUEST_REJECTED, {
    userId: request.requesterId,
    data: {},
    meta: { requestId: request._id }
  });

  return { success: true, message: "Request rejected", data: { request } };
};

const cancelRequest = async (requestId, userId) => {
  const request = await ConnectionRequest.findOne({
    _id: requestId,
    $or: [{ requesterId: userId }, { receiverId: userId }]
  });
  if (!request) throw ApiError.notFound("Request not found");

  if (!isCancellable(request.status)) {
    throw ApiError.badRequest(`Cannot cancel a request that is already ${request.status}. Once accepted, use remove connection.`);
  }

  request.status = REQUEST_STATUS.CANCELLED;
  request.statusHistory.push({ status: REQUEST_STATUS.CANCELLED, changedBy: userId, note: "Cancelled" });
  await request.save();

  return { success: true, message: "Request cancelled", data: { request } };
};

const removeConnection = async (userId, otherUserId) => {
  const { userA, userB } = canonicalizePair(userId, otherUserId);
  const connection = await Connection.findOne({ userA, userB, status: CONNECTION_STATUS.ACTIVE });
  if (!connection) throw ApiError.notFound("Connection not found");

  connection.status = CONNECTION_STATUS.REMOVED;
  connection.removedBy = userId;
  connection.removedAt = new Date();
  await connection.save();

  await closeConversation(userId, otherUserId, { connectionId: connection._id });

  return { success: true, message: "Connection removed", data: null };
};

const getMyConnections = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = { status: CONNECTION_STATUS.ACTIVE, $or: [{ userA: userId }, { userB: userId }] };

  const [connections, total] = await Promise.all([
    Connection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("userA", "username email role").populate("userB", "username email role").lean(),
    Connection.countDocuments(filter)
  ]);

  const normalized = connections.map((connection) => {
    const isUserA = connection.userA._id.toString() === userId.toString();
    return {
      connectionId: connection._id,
      user: isUserA ? connection.userB : connection.userA,
      connectedSince: connection.createdAt
    };
  });

  return { connections: normalized, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getReceivedRequests = async (userId, { page = 1, limit = 20, status } = {}) => {
  const filter = { receiverId: userId };
  filter.status = status || REQUEST_STATUS.PENDING;
  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    ConnectionRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("requesterId", "username email role").lean(),
    ConnectionRequest.countDocuments(filter)
  ]);

  return { requests, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getSentRequests = async (userId, { page = 1, limit = 20, status } = {}) => {
  const filter = { requesterId: userId };
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);

  const [requests, total] = await Promise.all([
    ConnectionRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("receiverId", "username email role").lean(),
    ConnectionRequest.countDocuments(filter)
  ]);

  return { requests, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getConnectionStatus = async (userId, otherUserId) => {
  if (userId.toString() === otherUserId.toString()) return { status: RELATIONSHIP_STATUS.NONE };

  const { userA, userB } = canonicalizePair(userId, otherUserId);
  const connection = await Connection.findOne({ userA, userB, status: CONNECTION_STATUS.ACTIVE });
  if (connection) return { status: RELATIONSHIP_STATUS.CONNECTED };

  const pendingRequest = await ConnectionRequest.findOne({
    status: REQUEST_STATUS.PENDING,
    $or: [{ requesterId: userId, receiverId: otherUserId }, { requesterId: otherUserId, receiverId: userId }]
  });

  if (!pendingRequest) return { status: RELATIONSHIP_STATUS.NONE };

  return {
    status: pendingRequest.requesterId.toString() === userId.toString()
      ? RELATIONSHIP_STATUS.PENDING_SENT
      : RELATIONSHIP_STATUS.PENDING_RECEIVED,
    requestId: pendingRequest._id
  };
};

const getConnectionStatusesForViewer = async (viewerId, targetUserIds = []) => {
  const statusMap = new Map();
  const viewerIdStr = viewerId.toString();
  const uniqueTargets = [...new Set(targetUserIds.map((id) => id.toString()))].filter((id) => id !== viewerIdStr);

  if (uniqueTargets.length === 0) return statusMap;

  const pairs = uniqueTargets.map((targetId) => canonicalizePair(viewerId, targetId));
  const connections = await Connection.find({
    status: CONNECTION_STATUS.ACTIVE,
    $or: pairs.map(({ userA, userB }) => ({ userA, userB }))
  }).select("userA userB").lean();

  const connectedSet = new Set();
  for (const conn of connections) {
    const otherId = conn.userA.toString() === viewerIdStr ? conn.userB.toString() : conn.userA.toString();
    connectedSet.add(otherId);
  }

  const remainingTargets = uniqueTargets.filter((id) => !connectedSet.has(id));
  let pendingRequests = [];

  if (remainingTargets.length > 0) {
    pendingRequests = await ConnectionRequest.find({
      status: REQUEST_STATUS.PENDING,
      $or: [
        { requesterId: viewerId, receiverId: { $in: remainingTargets } },
        { requesterId: { $in: remainingTargets }, receiverId: viewerId }
      ]
    }).select("requesterId receiverId").lean();
  }

  const pendingMap = new Map();
  for (const req of pendingRequests) {
    const requesterIdStr = req.requesterId.toString();
    const otherId = requesterIdStr === viewerIdStr ? req.receiverId.toString() : requesterIdStr;
    pendingMap.set(otherId, {
      status: requesterIdStr === viewerIdStr ? RELATIONSHIP_STATUS.PENDING_SENT : RELATIONSHIP_STATUS.PENDING_RECEIVED,
      requestId: req._id
    });
  }

  for (const targetId of uniqueTargets) {
    if (connectedSet.has(targetId)) statusMap.set(targetId, { status: RELATIONSHIP_STATUS.CONNECTED });
    else if (pendingMap.has(targetId)) statusMap.set(targetId, pendingMap.get(targetId));
    else statusMap.set(targetId, { status: RELATIONSHIP_STATUS.NONE });
  }

  return statusMap;
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  removeConnection,
  getMyConnections,
  getReceivedRequests,
  getSentRequests,
  getConnectionStatus,
  getConnectionStatusesForViewer
};