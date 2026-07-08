// backend/src/modules/recommendation/controllers/recommendation.controller.js
const {
  getRecommendedJobs,
  getJobMatchForCandidate
} = require("../services/recommendation.service");
const sendResponse = require("../../../shared/response/sendResponse");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const logger = require("../../../shared/logger/logger");

// GET /recommendation/jobs
// Candidate ke liye ranked, eligible, paginated job recommendations.
const getRecommendedJobsController = asyncHandler(async (req, res) => {
  const { page, limit, minScore } = req.query;

  const result = await getRecommendedJobs(req.user.id, { page, limit, minScore });

  logger.info("Recommended jobs fetched", {
    module: "Recommendation",
    userId: req.user.id,
    scannedJobs: result.meta.scannedJobs || 0,
    returned: result.jobs.length
  });

  return sendResponse(res, {
    success: true,
    message: result.meta.recommendationsEnabled
      ? "Recommended jobs fetched successfully"
      : result.meta.message,
    data: { jobs: result.jobs },
    meta: {
      pagination: result.pagination,
      ...result.meta
    }
  });
});

// GET /recommendation/jobs/:jobId
// Ek specific job ke against candidate ka match score + breakdown (self-only, debug/detail view).
const getJobMatchController = asyncHandler(async (req, res) => {
  const { job, match } = await getJobMatchForCandidate(req.user.id, req.params.jobId);

  logger.info("Job match score computed", {
    module: "Recommendation",
    userId: req.user.id,
    jobId: req.params.jobId,
    finalScore: match.finalScore
  });

  return sendResponse(res, {
    success: true,
    message: "Job match score calculated successfully",
    data: {
      job: {
        _id: job._id,
        title: job.title,
        company: job.company
      },
      match
    }
  });
});

module.exports = {
  getRecommendedJobsController,
  getJobMatchController
};