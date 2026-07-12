// backend/src/modules/learning/services/subjectDiscussion.service.js
//
// FIX (Phase 2b): createDiscussion() used to reuse
// NOTIFICATION_EVENTS.RESOURCE_COMMENT_RECEIVED for answer notifications
// — wrong semantics ("commented on your resource" text on a genuine
// Q&A answer) AND commenterName was hardcoded to "" (empty string),
// unlike resourceEngagement.service.js's identical-purpose functions
// which correctly call getUsernameSafe(). Fixed by:
//   1. Using a dedicated NOTIFICATION_EVENTS.SUBJECT_DISCUSSION_ANSWERED
//      key (must be added to notification.constants.js — see note below).
//   2. Fetching the real answerer's username via getUsernameSafe(),
//      same helper resourceEngagement.service.js already uses.
//
// ⚠️ REQUIRES a matching addition to
// modules/notification/constants/notification.constants.js:
//   SUBJECT_DISCUSSION_ANSWERED: "learning.discussion.answered",
// plus an EVENT_METADATA entry (category: LEARNING, actionType:
// OPEN_LEARNING_RESOURCE, titleTemplate: "New answer to your question",
// bodyTemplate: "{{answererName}} answered your question."). Without
// that constants-file addition, notify()'s NOTIFICATION_EVENT_VALUES
// guard will silently no-op this call, same failure mode the RESOURCE_*
// events had before they were added.

const Subject = require("../models/Subject");
const SubjectDiscussion = require("../models/SubjectDiscussion");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");

const assertSubjectExists = async (subjectId) => {
  const subject = await Subject.findOne({ _id: subjectId, isArchived: false }).lean();
  if (!subject) throw ApiError.notFound("Subject not found");
  return subject;
};

// Same helper resourceEngagement.service.js already defines — kept as
// a local copy rather than a shared import to avoid introducing a new
// cross-service dependency for one function; promote to a shared
// util if a third service ever needs it.
const getUsernameSafe = async (userId) => {
  const user = await User.findById(userId).select("username").lean().catch(() => null);
  return user ? user.username : "Someone";
};

// ── Create (question or answer) ────────────────────────────────────
const createDiscussion = async (userId, userRole, subjectId, { content, parentDiscussionId = null, title = "" }) => {
  await assertSubjectExists(subjectId);

  let parent = null;
  if (parentDiscussionId) {
    parent = await SubjectDiscussion.findOne({ _id: parentDiscussionId, status: "active" });
    if (!parent || parent.subjectId.toString() !== subjectId.toString()) {
      throw ApiError.badRequest("Invalid parent discussion");
    }
    // Single-level nesting only — an answer cannot itself be answered.
    if (parent.parentDiscussionId) {
      throw ApiError.badRequest("Cannot reply to an answer directly");
    }
  }

  // Snapshot at write time — a Faculty member who later loses faculty
  // status shouldn't retroactively un-badge their past answers, same
  // discipline LearningResource.uploaderRole already follows.
  const isFacultyAnswer = userRole === "faculty" || userRole === "admin";

  const discussion = await SubjectDiscussion.create({
    subjectId,
    authorId: userId,
    content,
    parentDiscussionId,
    title: parentDiscussionId ? "" : title,
    isFacultyAnswer
  });

  if (parentDiscussionId) {
    await SubjectDiscussion.updateOne({ _id: parentDiscussionId }, { $inc: { answerCount: 1 } });

    if (parent.authorId.toString() !== userId.toString()) {
      // FIXED (Phase 2b) — dedicated event + real username.
      const answererName = await getUsernameSafe(userId);
      await notify(NOTIFICATION_EVENTS.SUBJECT_DISCUSSION_ANSWERED, {
        userId: parent.authorId,
        data: { answererName, questionTitle: parent.title || "your question" },
        meta: { subjectId, discussionId: discussion._id, questionId: parentDiscussionId }
      });
    }
  }

  return { success: true, message: parentDiscussionId ? "Answer posted" : "Question posted", data: { discussion } };
};

const editDiscussion = async (userId, discussionId, content) => {
  const discussion = await SubjectDiscussion.findOne({ _id: discussionId, authorId: userId, status: "active" });
  if (!discussion) throw ApiError.notFound("Discussion not found");

  discussion.content = content;
  discussion.isEdited = true;
  discussion.editedAt = new Date();
  await discussion.save();

  return { success: true, message: "Discussion updated", data: { discussion } };
};

const deleteDiscussion = async (userId, userRole, discussionId) => {
  const discussion = await SubjectDiscussion.findOne({ _id: discussionId, status: "active" });
  if (!discussion) throw ApiError.notFound("Discussion not found");

  const isAuthor = discussion.authorId.toString() === userId.toString();
  if (!isAuthor && userRole !== "admin" && userRole !== "faculty") {
    throw ApiError.forbidden("You can only delete your own posts");
  }

  discussion.status = "removed";
  await discussion.save();

  if (discussion.parentDiscussionId) {
    await SubjectDiscussion.updateOne({ _id: discussion.parentDiscussionId }, { $inc: { answerCount: -1 } });
  }

  return { success: true, message: "Discussion deleted", data: null };
};

// ── Reads ───────────────────────────────────────────────────────────
const getQuestions = async (subjectId, { cursor, limit = 20 } = {}) => {
  await assertSubjectExists(subjectId);
  const pageSize = Math.min(Number(limit), 50);
  const filter = { subjectId, parentDiscussionId: null, status: "active" };
  if (cursor) filter._id = { $lt: cursor };

  const questions = await SubjectDiscussion.find(filter)
    .sort({ pinned: -1, pinnedAt: -1, createdAt: -1 })
    .limit(pageSize)
    .populate("authorId", "username role")
    .lean();

  const nextCursor = questions.length === pageSize ? questions[questions.length - 1]._id : null;
  return { questions, nextCursor };
};

const getAnswers = async (questionId) => {
  const question = await SubjectDiscussion.findOne({ _id: questionId, status: "active" }).lean();
  if (!question) throw ApiError.notFound("Question not found");

  const answers = await SubjectDiscussion.find({ parentDiscussionId: questionId, status: "active" })
    .sort({ createdAt: 1 })
    .populate("authorId", "username role")
    .lean();
  return answers;
};

// ── Q&A-specific actions ────────────────────────────────────────────
const acceptAnswer = async (userId, userRole, questionId, answerId) => {
  const question = await SubjectDiscussion.findOne({ _id: questionId, parentDiscussionId: null, status: "active" });
  if (!question) throw ApiError.notFound("Question not found");

  const isAuthor = question.authorId.toString() === userId.toString();
  if (!isAuthor && userRole !== "admin" && userRole !== "faculty") {
    throw ApiError.forbidden("Only the question author or faculty can accept an answer");
  }

  const answer = await SubjectDiscussion.findOne({ _id: answerId, parentDiscussionId: questionId, status: "active" });
  if (!answer) throw ApiError.badRequest("Answer does not belong to this question");

  question.acceptedAnswerId = answer._id;
  await question.save();

  return { success: true, message: "Answer marked as accepted", data: { question } };
};

// Faculty/Admin only — pins a question to the top of the subject's list.
const togglePin = async (userRole, questionId) => {
  if (userRole !== "faculty" && userRole !== "admin") {
    throw ApiError.forbidden("Only faculty or admin can pin a question");
  }

  const question = await SubjectDiscussion.findOne({ _id: questionId, parentDiscussionId: null, status: "active" });
  if (!question) throw ApiError.notFound("Question not found");

  question.pinned = !question.pinned;
  question.pinnedAt = question.pinned ? new Date() : null;
  await question.save();

  return { success: true, message: question.pinned ? "Question pinned" : "Question unpinned", data: { question } };
};

const toggleLike = async (userId, discussionId) => {
  const discussion = await SubjectDiscussion.findOne({ _id: discussionId, status: "active" });
  if (!discussion) throw ApiError.notFound("Discussion not found");

  const alreadyLiked = discussion.likedBy.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    await SubjectDiscussion.updateOne({ _id: discussionId }, { $pull: { likedBy: userId }, $inc: { likeCount: -1 } });
    return { success: true, message: "Like removed", data: { liked: false } };
  }

  await SubjectDiscussion.updateOne({ _id: discussionId }, { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } });
  return { success: true, message: "Discussion liked", data: { liked: true } };
};

module.exports = {
  createDiscussion,
  editDiscussion,
  deleteDiscussion,
  getQuestions,
  getAnswers,
  acceptAnswer,
  togglePin,
  toggleLike
};