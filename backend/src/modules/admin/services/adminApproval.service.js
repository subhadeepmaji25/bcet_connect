// backend/src/modules/admin/services/adminApproval.service.js
const jobService = require("../../jobs/services/job.service");
const eventService = require("../../events/services/event.service");
const resourceService = require("../../learning/services/resource.service");
const mentorProfileService = require("../../mentorship/services/mentorProfile.service");
const feedReportService = require("../../feed/services/feedReport.service");

const MentorProfile = require("../../mentorship/models/MentorProfile");
const { VERIFICATION_STATUS } = require("../../mentorship/constants/mentor.constants");

const ApiError = require("../../../shared/errors/ApiError");
const { APPROVAL_QUEUE_TYPES } = require("../constants/admin.constants");
const { logAction } = require("./adminAuditLog.service");

const getPendingMentors = async ({ page = 1, limit = 20 } = {}) => {
  const filter = { verificationStatus: VERIFICATION_STATUS.PENDING };
  const skip = (Number(page) - 1) * Number(limit);
  const [mentors, total] = await Promise.all([
    MentorProfile.find(filter)
      .populate("userId", "username email role")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    MentorProfile.countDocuments(filter)
  ]);
  return {
    mentors,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

const getUnifiedPendingQueue = async ({ page = 1, limit = 10 } = {}) => {
  const [jobsResult, eventsResult, resourcesResult, mentorsResult, reportsResult] = await Promise.all([
    jobService.getPendingJobs({ page, limit }),
    eventService.getPendingEvents({ page, limit }),
    resourceService.listPendingForFaculty(null, "admin", { page, limit }),
    getPendingMentors({ page, limit }),
    feedReportService.getReports("admin", { status: "pending", page, limit })
  ]);

  return {
    success: true,
    message: "Pending approval queue fetched",
    data: {
      jobs: jobsResult.jobs,
      events: eventsResult.events,
      resources: resourcesResult.resources,
      mentors: mentorsResult.mentors,
      reports: reportsResult.reports,
      counts: {
        jobs: jobsResult.pagination.total,
        events: eventsResult.pagination.total,
        resources: resourcesResult.pagination.total,
        mentors: mentorsResult.pagination.total,
        reports: reportsResult.pagination.total,
        total:
          jobsResult.pagination.total +
          eventsResult.pagination.total +
          resourcesResult.pagination.total +
          mentorsResult.pagination.total +
          reportsResult.pagination.total
      }
    }
  };
};

const getPendingByType = async (type, { page = 1, limit = 20 } = {}) => {
  switch (type) {
    case APPROVAL_QUEUE_TYPES.JOB:
      return jobService.getPendingJobs({ page, limit });
    case APPROVAL_QUEUE_TYPES.EVENT:
      return eventService.getPendingEvents({ page, limit });
    case APPROVAL_QUEUE_TYPES.RESOURCE:
      return resourceService.listPendingForFaculty(null, "admin", { page, limit });
    case APPROVAL_QUEUE_TYPES.MENTOR:
      return getPendingMentors({ page, limit });
    case APPROVAL_QUEUE_TYPES.REPORT:
      return feedReportService.getReports("admin", { status: "pending", page, limit });
    default:
      throw ApiError.badRequest(`Unknown approval queue type: ${type}`);
  }
};

const decideApproval = async (type, itemId, adminId, { decision, reason = "" } = {}) => {
  if (!["approve", "reject"].includes(decision)) {
    throw ApiError.badRequest('decision must be "approve" or "reject"');
  }

  let result;

  switch (type) {
    case APPROVAL_QUEUE_TYPES.JOB:
      result = decision === "approve"
        ? await jobService.approveJob(itemId, adminId)
        : await jobService.rejectJob(itemId, adminId, reason);
      break;

    case APPROVAL_QUEUE_TYPES.EVENT:
      result = decision === "approve"
        ? await eventService.approveEvent(itemId, adminId)
        : await eventService.rejectEvent(itemId, adminId, reason);
      break;

    case APPROVAL_QUEUE_TYPES.RESOURCE:
      result = await resourceService.verifyResource(
        itemId, adminId, "admin", decision === "approve" ? "verified" : "rejected", reason
      );
      break;

    case APPROVAL_QUEUE_TYPES.MENTOR:
      result = decision === "approve"
        ? await mentorProfileService.verifyMentor(itemId, adminId)
        : await mentorProfileService.rejectMentor(itemId, adminId, reason);
      break;

    case APPROVAL_QUEUE_TYPES.REPORT:
      result = await feedReportService.resolveReport(
        adminId, "admin", itemId, { status: decision === "approve" ? "resolved" : "dismissed", resolutionNote: reason }
      );
      break;

    default:
      throw ApiError.badRequest(`Unknown approval queue type: ${type}`);
  }

  await logAction({
    adminId,
    action: decision,
    targetType: type,
    targetId: itemId,
    reason,
    metadata: { decision }
  });

  return result;
};

module.exports = { getUnifiedPendingQueue, getPendingByType, decideApproval };