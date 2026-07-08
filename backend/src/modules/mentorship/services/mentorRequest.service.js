// backend/src/modules/mentorship/services/mentorRequest.service.js
const MentorRequest = require("../models/MentorRequest");
const MentorProfile = require("../models/MentorProfile");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const {
  REQUEST_STATUS,
  CANCELLABLE_REQUEST_STATUSES,
  MENTOR_STATUS,
  VERIFICATION_STATUS
} = require("../constants/mentor.constants");
const conversationService = require("../../communication/services/conversation.service");
const { CONVERSATION_TYPES } = require("../../communication/constants/communication.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const logger = require("../../../shared/logger/logger");

const isActionable = (status) => status === REQUEST_STATUS.PENDING;
const isCancellable = (status) => CANCELLABLE_REQUEST_STATUSES.includes(status);

const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

const ensureConversation = async (studentId, mentorId, context) => {
  try {
    return await conversationService.getOrCreateConversation(studentId, mentorId, CONVERSATION_TYPES.MENTORSHIP);
  } catch (err) {
    logger.error("Failed to create mentorship conversation after accept", {
      module: "Mentorship",
      ...context,
      error: err.message
    });
    return null;
  }
};

const createRequest = async (studentId, payload) => {
  const { mentorId } = payload;

  if (mentorId.toString() === studentId.toString()) {
    throw ApiError.badRequest("You cannot send a mentorship request to yourself");
  }

  const mentorProfile = await MentorProfile.findOne({ userId: mentorId });
  if (!mentorProfile) throw ApiError.notFound("Mentor not found");

  if (mentorProfile.mentorStatus !== MENTOR_STATUS.ACTIVE) {
    throw ApiError.badRequest("This mentor is not currently accepting requests");
  }

  if (mentorProfile.verificationStatus !== VERIFICATION_STATUS.VERIFIED) {
    throw ApiError.badRequest("This mentor is not verified yet and cannot receive requests");
  }

  const existingActive = await MentorRequest.findOne({
    studentId,
    mentorId,
    status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.ACCEPTED] }
  });

  if (existingActive) throw ApiError.conflict("You already have an active request with this mentor");

  const request = await MentorRequest.create({
    studentId,
    mentorId,
    ...payload,
    status: REQUEST_STATUS.PENDING,
    statusHistory: [{ status: REQUEST_STATUS.PENDING, changedBy: studentId, note: "Request created" }]
  });

  const studentName = await getUsernameSafe(studentId);
  const topic = payload.topic || payload.subject || "your expertise";

  await notify(NOTIFICATION_EVENTS.MENTOR_REQUEST_CREATED, {
    userId: mentorId,
    data: { studentName, topic },
    meta: { requestId: request._id }
  });

  return { success: true, message: "Mentorship request sent successfully", data: { request } };
};

const acceptRequest = async (requestId, mentorUserId, meetingNote = "") => {
  const request = await MentorRequest.findOne({ _id: requestId, mentorId: mentorUserId });
  if (!request) throw ApiError.notFound("Request not found");
  if (!isActionable(request.status)) throw ApiError.badRequest(`Request is already ${request.status}`);

  request.status = REQUEST_STATUS.ACCEPTED;
  request.respondedAt = new Date();
  if (meetingNote) request.meetingNote = meetingNote;
  request.statusHistory.push({
    status: REQUEST_STATUS.ACCEPTED,
    changedBy: mentorUserId,
    note: meetingNote || "Request accepted"
  });
  await request.save();

  const conversation = await ensureConversation(request.studentId, request.mentorId, { requestId });
  const mentorName = await getUsernameSafe(mentorUserId);

  await notify(NOTIFICATION_EVENTS.MENTOR_REQUEST_ACCEPTED, {
    userId: request.studentId,
    data: { mentorName },
    meta: { requestId: request._id }
  });

  return { success: true, message: "Request accepted", data: { request, chatUnlocked: true, conversation } };
};

const rejectRequest = async (requestId, mentorUserId, reason = "") => {
  const request = await MentorRequest.findOne({ _id: requestId, mentorId: mentorUserId });
  if (!request) throw ApiError.notFound("Request not found");
  if (!isActionable(request.status)) throw ApiError.badRequest(`Request is already ${request.status}`);

  request.status = REQUEST_STATUS.REJECTED;
  request.respondedAt = new Date();
  request.rejectionReason = reason;
  request.statusHistory.push({
    status: REQUEST_STATUS.REJECTED,
    changedBy: mentorUserId,
    note: reason || "Request rejected"
  });
  await request.save();

  await notify(NOTIFICATION_EVENTS.MENTOR_REQUEST_REJECTED, {
    userId: request.studentId,
    data: {},
    meta: { requestId: request._id }
  });

  return { success: true, message: "Request rejected", data: { request } };
};

const cancelRequest = async (requestId, userId) => {
  const request = await MentorRequest.findOne({
    _id: requestId,
    $or: [{ studentId: userId }, { mentorId: userId }]
  });

  if (!request) throw ApiError.notFound("Request not found");

  if (!isCancellable(request.status)) {
    throw ApiError.badRequest(`Cannot cancel a request that is already ${request.status}. Once accepted, cancel the session instead.`);
  }

  request.status = REQUEST_STATUS.CANCELLED;
  request.statusHistory.push({ status: REQUEST_STATUS.CANCELLED, changedBy: userId, note: "Cancelled" });
  await request.save();

  return { success: true, message: "Request cancelled", data: { request } };
};

const getMyRequests = async (studentId, { page = 1, limit = 10, status } = {}) => {
  const filter = { studentId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    MentorRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "mentorId",
        select: "username email role profileId",
        populate: { path: "profileId", select: "fullName avatar currentCompany designation headline location" }
      })
      .lean(),
    MentorRequest.countDocuments(filter)
  ]);

  return { requests, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getReceivedRequests = async (mentorUserId, { page = 1, limit = 10, status } = {}) => {
  const filter = { mentorId: mentorUserId };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    MentorRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate({
        path: "studentId",
        select: "username email role profileId",
        populate: { path: "profileId", select: "fullName avatar branch department" }
      })
      .lean(),
    MentorRequest.countDocuments(filter)
  ]);

  return { requests, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getRequestById = async (requestId, requesterId) => {
  const request = await MentorRequest.findById(requestId)
    .populate({
      path: "studentId",
      select: "username email role profileId",
      populate: { path: "profileId", select: "fullName avatar branch department" }
    })
    .populate({
      path: "mentorId",
      select: "username email role profileId",
      populate: { path: "profileId", select: "fullName avatar currentCompany designation headline location" }
    });

  if (!request) throw ApiError.notFound("Request not found");

  const isStudent = request.studentId._id.toString() === requesterId.toString();
  const isMentor = request.mentorId._id.toString() === requesterId.toString();

  if (!isStudent && !isMentor) throw ApiError.forbidden("You are not part of this mentorship request");

  return { success: true, message: "Request fetched", data: { request, chatUnlocked: request.status === REQUEST_STATUS.ACCEPTED } };
};

const hasAcceptedMentorship = async (userIdOne, userIdTwo) => {
  const accepted = await MentorRequest.exists({
    status: REQUEST_STATUS.ACCEPTED,
    $or: [
      { studentId: userIdOne, mentorId: userIdTwo },
      { studentId: userIdTwo, mentorId: userIdOne }
    ]
  });

  return Boolean(accepted);
};

const getRequestStatus = async (studentId, mentorUserId) => {
  if (!studentId || !mentorUserId) return null;
  if (studentId.toString() === mentorUserId.toString()) return null;

  const request = await MentorRequest.findOne({ studentId, mentorId: mentorUserId })
    .sort({ createdAt: -1 })
    .select("status")
    .lean();

  return request ? request.status : null;
};

module.exports = {
  createRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getMyRequests,
  getReceivedRequests,
  getRequestById,
  hasAcceptedMentorship,
  getRequestStatus
};