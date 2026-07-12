// backend/src/modules/learning/services/learningProgress.service.js
const LearningResource = require("../models/LearningResource");
const LearningProgress = require("../models/LearningProgress");
const ApiError = require("../../../shared/errors/ApiError");
const { RESOURCE_STATUS } = require("../constants/resource.constants");
const { assertCanAccessResource } = require("./resource.service");

const PROGRESS_STATUS = Object.freeze({
  STARTED: "started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
});

const assertResourceExists = async (resourceId, userId, userRole) => {
  const resource = await assertCanAccessResource(resourceId, userId, userRole, { includeUnpublishedForOwner: false });
  if (resource.status !== RESOURCE_STATUS.PUBLISHED) throw ApiError.notFound("Resource not found");
  if (!resource) throw ApiError.notFound("Resource not found");
  return resource;
};

const markAsOpened = async (userId, userRole, resourceId) => {
  await assertResourceExists(resourceId, userId, userRole);
  const progress = await LearningProgress.findOneAndUpdate(
    { userId, resourceId },
    {
      $inc: { openCount: 1 },
      $set: { lastOpenedAt: new Date() },
      $setOnInsert: { status: PROGRESS_STATUS.STARTED, completionPercent: 0 }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { success: true, message: "Progress recorded", data: { progress } };
};

const updateProgress = async (userId, userRole, resourceId, { status, completionPercent } = {}) => {
  await assertResourceExists(resourceId, userId, userRole);
  const progress = await LearningProgress.findOne({ userId, resourceId });
  if (!progress) throw ApiError.notFound("Open this resource before updating progress");

  if (completionPercent !== undefined) {
    progress.completionPercent = Math.min(100, Math.max(0, Number(completionPercent)));
  }

  let nextStatus = status || progress.status;
  if (progress.completionPercent >= 100) {
    nextStatus = PROGRESS_STATUS.COMPLETED;
  } else if (nextStatus === PROGRESS_STATUS.COMPLETED && progress.completionPercent < 100) {
    nextStatus = PROGRESS_STATUS.IN_PROGRESS;
  }

  if (nextStatus === PROGRESS_STATUS.COMPLETED && progress.status !== PROGRESS_STATUS.COMPLETED) {
    progress.completedAt = new Date();
  }

  progress.status = nextStatus;
  await progress.save();

  return { success: true, message: "Progress updated", data: { progress } };
};

const getMyProgress = async (userId, resourceId) => {
  const progress = await LearningProgress.findOne({ userId, resourceId }).lean();
  return progress || null;
};

const getContinueLearning = async (userId, { limit = 10 } = {}) => {
  const items = await LearningProgress.find({
    userId,
    status: { $in: [PROGRESS_STATUS.STARTED, PROGRESS_STATUS.IN_PROGRESS] }
  })
    .sort({ lastOpenedAt: -1 })
    .limit(Math.min(Number(limit), 30))
    .populate({
      path: "resourceId",
      match: { status: RESOURCE_STATUS.PUBLISHED, isArchived: false },
      select: "title type subjectId department semester"
    })
    .lean();

  return items
    .filter((item) => item.resourceId)
    .map((item) => ({
      resource: item.resourceId,
      status: item.status,
      completionPercent: item.completionPercent,
      lastOpenedAt: item.lastOpenedAt
    }));
};

const getResourceProgressStats = async (resourceId) => {
  await assertResourceExists(resourceId);
  const rows = await LearningProgress.aggregate([
    { $match: { resourceId: new (require("mongoose").Types.ObjectId)(resourceId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const stats = { started: 0, in_progress: 0, completed: 0 };
  rows.forEach((row) => { stats[row._id] = row.count; });

  return { success: true, message: "Progress stats fetched", data: { stats } };
};

module.exports = {
  markAsOpened,
  updateProgress,
  getMyProgress,
  getContinueLearning,
  getResourceProgressStats
};
