// backend/src/modules/learning/controllers/subjectDiscussion.controller.js

const discussionService = require("../services/subjectDiscussion.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");

const createDiscussionController = asyncHandler(async (req, res) => {
  const result = await discussionService.createDiscussion(req.user.id, req.user.role, req.params.subjectId, req.body);
  return sendResponse(res, { statusCode: 201, ...result });
});

const editDiscussionController = asyncHandler(async (req, res) => {
  const result = await discussionService.editDiscussion(req.user.id, req.params.discussionId, req.body.content);
  return sendResponse(res, result);
});

const deleteDiscussionController = asyncHandler(async (req, res) => {
  const result = await discussionService.deleteDiscussion(req.user.id, req.user.role, req.params.discussionId);
  return sendResponse(res, result);
});

const getQuestionsController = asyncHandler(async (req, res) => {
  const result = await discussionService.getQuestions(req.params.subjectId, req.query);
  return sendResponse(res, {
    success: true,
    message: "Questions fetched successfully",
    data: { questions: result.questions },
    meta: { nextCursor: result.nextCursor }
  });
});

const getAnswersController = asyncHandler(async (req, res) => {
  const answers = await discussionService.getAnswers(req.params.discussionId);
  return sendResponse(res, { success: true, message: "Answers fetched successfully", data: { answers } });
});

const acceptAnswerController = asyncHandler(async (req, res) => {
  const result = await discussionService.acceptAnswer(req.user.id, req.user.role, req.params.discussionId, req.body.answerId);
  return sendResponse(res, result);
});

const togglePinController = asyncHandler(async (req, res) => {
  const result = await discussionService.togglePin(req.user.role, req.params.discussionId);
  return sendResponse(res, result);
});

const toggleLikeController = asyncHandler(async (req, res) => {
  const result = await discussionService.toggleLike(req.user.id, req.params.discussionId);
  return sendResponse(res, result);
});

module.exports = {
  createDiscussionController,
  editDiscussionController,
  deleteDiscussionController,
  getQuestionsController,
  getAnswersController,
  acceptAnswerController,
  togglePinController,
  toggleLikeController
};