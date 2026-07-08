// backend/src/modules/jobs/services/application.service.js
const JobApplication = require("../models/JobApplication");
const Job = require("../models/Job");
const Resume = require("../../users/models/Resume");
const User = require("../../auth/models/User");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");
const { loadCandidateContext, calculateMatchScoreForApplication } = require("../../recommendation/services/recommendation.service");
const { checkEligibility } = require("../../recommendation/services/eligibility.service");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");

const REVIEW_STATUSES = ["shortlisted", "rejected", "accepted"];
const TERMINAL_STATUSES = ["accepted", "rejected", "withdrawn"];

const applyForJob = async (jobId, applicantId, payload) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.status !== "approved") throw ApiError.badRequest("This job is not accepting applications");
  if (job.deadline && new Date() > new Date(job.deadline)) throw ApiError.badRequest("Application deadline has passed");

  const existing = await JobApplication.findOne({ jobId, applicantId });
  if (existing) throw ApiError.conflict("You have already applied for this job");

  const candidate = await loadCandidateContext(applicantId);
  const eligibility = checkEligibility(candidate, job);
  if (!eligibility.eligible) {
    throw ApiError.badRequest(`You are not eligible for this job: ${eligibility.reasons.join(", ")}`);
  }

  let resumeId = payload.resumeId || null;

  if (resumeId) {
    const resume = await Resume.findOne({ _id: resumeId, userId: applicantId, isDeleted: false });
    if (!resume) throw ApiError.badRequest("Resume not found");
  }

  if (!resumeId) {
    const defaultResume = await Resume.findOne({ userId: applicantId, isDefault: true, isDeleted: false });
    if (defaultResume) resumeId = defaultResume._id;
  }

  const matchScore = await calculateMatchScoreForApplication(applicantId, job);

  const application = await JobApplication.create({
    jobId,
    applicantId,
    resumeId,
    coverLetter: payload.coverLetter || "",
    matchScore,
    status: "applied",
    statusHistory: [{ status: "applied", changedBy: applicantId, changedAt: new Date(), note: "Application submitted" }]
  });

  await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: 1 } });

  logger.info("Job application created with match score", { module: "Jobs", jobId, applicantId, matchScore });

  const applicant = await User.findById(applicantId).select("username").lean().catch(() => null);
  await notify(NOTIFICATION_EVENTS.APPLICATION_RECEIVED, {
    userId: job.postedBy,
    data: { applicantName: applicant ? applicant.username : "A candidate", jobTitle: job.title },
    meta: { jobId: job._id, applicationId: application._id }
  });

  return { success: true, message: "Application submitted successfully", data: { application } };
};

const withdrawApplication = async (applicationId, applicantId) => {
  const application = await JobApplication.findOne({ _id: applicationId, applicantId });
  if (!application) throw ApiError.notFound("Application not found");
  if (TERMINAL_STATUSES.includes(application.status)) {
    throw ApiError.badRequest(`Cannot withdraw an application that is already ${application.status}`);
  }

  application.status = "withdrawn";
  application.withdrawnAt = new Date();
  application.statusHistory.push({ status: "withdrawn", changedBy: applicantId, changedAt: new Date(), note: "Withdrawn by applicant" });
  await application.save();

  await Job.updateOne({ _id: application.jobId }, { $inc: { applicationCount: -1 } });

  return { success: true, message: "Application withdrawn", data: null };
};

const getMyApplications = async (applicantId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    JobApplication.find({ applicantId }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate("jobId", "title company employmentType status deadline").lean(),
    JobApplication.countDocuments({ applicantId })
  ]);

  return { applications, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getJobApplications = async (jobId, requesterId, requesterRole, { page = 1, limit = 10, sortBy = "createdAt" } = {}) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");

  const isOwner = job.postedBy.toString() === requesterId.toString();
  if (!isOwner && requesterRole !== "admin") throw ApiError.forbidden("Not authorized to view these applications");

  const sortOption = sortBy === "matchScore" ? { matchScore: -1, createdAt: -1 } : { createdAt: -1 };
  const skip = (Number(page) - 1) * Number(limit);

  const [applications, total] = await Promise.all([
    JobApplication.find({ jobId }).sort(sortOption).skip(skip).limit(Number(limit)).populate("applicantId", "username email role").populate("resumeId", "fileName resumeUrl").lean(),
    JobApplication.countDocuments({ jobId })
  ]);

  return { applications, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const updateApplicationStatus = async (applicationId, reviewerId, reviewerRole, status, note = "") => {
  if (!REVIEW_STATUSES.includes(status)) throw ApiError.badRequest("Invalid status");

  const application = await JobApplication.findById(applicationId);
  if (!application) throw ApiError.notFound("Application not found");

  const job = await Job.findById(application.jobId);
  if (!job) throw ApiError.notFound("Associated job not found");

  const isOwner = job.postedBy.toString() === reviewerId.toString();
  if (!isOwner && reviewerRole !== "admin") throw ApiError.forbidden("You are not authorized to review this application");
  if (TERMINAL_STATUSES.includes(application.status)) {
    throw ApiError.badRequest(`Cannot change status - application is already ${application.status}`);
  }

  application.status = status;
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  if (note) application.reviewNote = note;
  application.statusHistory.push({ status, changedBy: reviewerId, changedAt: new Date(), note });
  await application.save();

  await notify(NOTIFICATION_EVENTS.APPLICATION_REVIEWED, {
    userId: application.applicantId,
    data: { jobTitle: job.title, status },
    meta: { jobId: job._id, applicationId: application._id }
  });

  return { success: true, message: `Application ${status}`, data: { application } };
};

module.exports = {
  applyForJob,
  withdrawApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus
};