// backend/src/modules/jobs/services/job.service.js
const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const Profile = require("../../users/models/Profile");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");

const POSTER_ROLES = ["faculty", "alumni", "admin"];
const ALLOWED_UPDATE_FIELDS = ["title", "company", "description", "category", "employmentType", "location", "isRemote", "requiredSkills", "preferredSkills", "minExperienceYears", "targetRoles", "salaryMin", "salaryMax", "isSalaryVisible", "deadline", "applyUrl", "eligibility", "visibility"];

const normalize = (value) => String(value || "").trim().toLowerCase();

const isJobPubliclyOpen = (job) => (
  job
  && job.status === "approved"
  && !job.isDeleted
  && !job.isArchived
  && (!job.deadline || new Date(job.deadline) >= new Date())
);

const canUserAccessJob = async (job, userId, userRole, viewerProfile = null) => {
  if (!job) return false;

  const isOwner = userId && job.postedBy.toString() === userId.toString();
  if (isOwner || userRole === "admin") {
    return true;
  }

  if (!isJobPubliclyOpen(job)) {
    return false;
  }

  if (job.visibility === "hidden") {
    return false;
  }

  if (job.visibility === "public" || job.visibility === "campus-only") {
    return true;
  }

  if (job.visibility === "branch-specific") {
    const profile = viewerProfile || await Profile.findOne({ userId }).select("branch department").lean();
    const viewerBranches = [profile?.branch, profile?.department]
      .map(normalize)
      .filter(Boolean);
    const allowedBranches = (job.eligibility?.allowedBranches || [])
      .map(normalize)
      .filter(Boolean);

    return viewerBranches.length > 0
      && allowedBranches.length > 0
      && viewerBranches.some((branch) => allowedBranches.includes(branch));
  }

  return false;
};

const buildApprovedJobVisibilityQuery = (viewerProfile = null) => {
  const visibilityQuery = [
    { visibility: "public" },
    { visibility: "campus-only" }
  ];

  const viewerBranches = [viewerProfile?.branch, viewerProfile?.department]
    .map(normalize)
    .filter(Boolean);

  if (viewerBranches.length > 0) {
    visibilityQuery.push({
      visibility: "branch-specific",
      "eligibility.allowedBranches": { $in: viewerBranches }
    });
  }

  return { $or: visibilityQuery };
};

const createJob = async (userId, userRole, payload) => {
  if (!POSTER_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty, alumni, or admin can post jobs");
  }
  const job = await Job.create({
    ...payload,
    postedBy: userId,
    postedByRole: userRole,
    status: userRole === "admin" ? "approved" : "pending"
  });
  return {
    success: true,
    message: userRole === "admin" ? "Job posted and approved" : "Job submitted for admin approval",
    data: { job }
  };
};

const updateJob = async (jobId, userId, payload) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.postedBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("You can only edit your own jobs");
  }
  if (["approved", "closed"].includes(job.status)) {
    throw ApiError.badRequest("Approved or closed jobs cannot be edited");
  }
  ALLOWED_UPDATE_FIELDS.forEach(field => {
    if (payload[field] !== undefined) job[field] = payload[field];
  });
  if (job.status === "rejected") {
    job.status = "pending";
    job.rejectedBy = null;
    job.rejectedAt = null;
    job.rejectionReason = "";
  }
  await job.save();
  return { success: true, message: "Job updated successfully", data: { job } };
};

const deleteJob = async (jobId, userId, userRole) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  const isOwner = job.postedBy.toString() === userId.toString();
  const isAdmin = userRole === "admin";
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden("You cannot delete this job");
  }
  job.isDeleted = true;
  job.deletedAt = new Date();
  await job.save();
  return { success: true, message: "Job deleted successfully", data: null };
};

const approveJob = async (jobId, adminId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.status !== "pending") {
    throw ApiError.badRequest(`Job is already ${job.status}`);
  }
  job.status = "approved";
  job.approvedBy = adminId;
  job.approvedAt = new Date();
  await job.save();

  // Notify the poster only after the approval is actually persisted.
  await notify(NOTIFICATION_EVENTS.JOB_APPROVED, {
    userId: job.postedBy,
    data: { jobTitle: job.title },
    meta: { jobId: job._id }
  });

  return { success: true, message: "Job approved successfully", data: { job } };
};

const rejectJob = async (jobId, adminId, rejectionReason) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  if (job.status !== "pending") {
    throw ApiError.badRequest(`Job is already ${job.status}`);
  }
  job.status = "rejected";
  job.rejectedBy = adminId;
  job.rejectedAt = new Date();
  job.rejectionReason = rejectionReason;
  await job.save();

  await notify(NOTIFICATION_EVENTS.JOB_REJECTED, {
    userId: job.postedBy,
    data: { jobTitle: job.title },
    meta: { jobId: job._id }
  });

  return { success: true, message: "Job rejected", data: { job } };
};

const closeJob = async (jobId, userId, userRole, closedReason = "") => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  const isOwner = job.postedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot close this job");
  }
  if (job.status !== "approved") {
    throw ApiError.badRequest(`Only approved jobs can be closed (current status: ${job.status})`);
  }
  job.status = "closed";
  job.closedBy = userId;
  job.closedAt = new Date();
  job.closedReason = closedReason;
  await job.save();

  // Notify the OWNER (job.postedBy) regardless of who actually closed
  // it — an admin can close someone else's job, and it's the owner who
  // needs to know, not the admin who just performed the action.
  await notify(NOTIFICATION_EVENTS.JOB_CLOSED, {
    userId: job.postedBy,
    data: { jobTitle: job.title },
    meta: { jobId: job._id }
  });

  return { success: true, message: "Job closed successfully", data: { job } };
};

const reopenJob = async (jobId, userId, userRole, payload = {}) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  const isOwner = job.postedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot reopen this job");
  }
  if (job.status !== "closed") {
    throw ApiError.badRequest(`Only closed jobs can be reopened (current status: ${job.status})`);
  }
  if (payload.deadline !== undefined) {
    const nextDeadline = payload.deadline ? new Date(payload.deadline) : null;
    if (payload.deadline && Number.isNaN(nextDeadline.getTime())) {
      throw ApiError.badRequest("Invalid deadline");
    }
    job.deadline = nextDeadline;
  }
  if (job.deadline && new Date() > new Date(job.deadline)) {
    throw ApiError.badRequest("Cannot reopen because the deadline has already passed. Provide a future deadline in this request.");
  }
  job.status = "approved";
  job.reopenedAt = new Date();
  job.closedBy = null;
  job.closedAt = null;
  job.closedReason = "";
  job.expiredAt = null;
  await job.save();
  return { success: true, message: "Job reopened successfully", data: { job } };
};

const archiveJob = async (jobId, userId, userRole) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  const isOwner = job.postedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot archive this job");
  }
  if (job.isArchived) {
    throw ApiError.badRequest("Job is already archived");
  }
  job.isArchived = true;
  job.archivedAt = new Date();
  await job.save();
  return { success: true, message: "Job archived successfully", data: { job } };
};

const expireJob = async (job) => {
  // Only actually transitions (and therefore only notifies) when the
  // deadline check is genuinely true this call — repeated calls on an
  // already-expired job are a no-op and must not re-notify every time
  // someone views the job (getJobById calls this on every read).
  if (job.status === "approved" && job.deadline && new Date() > new Date(job.deadline)) {
    await Job.updateOne(
      { _id: job._id, status: "approved" },
      { $set: { status: "expired", expiredAt: new Date() } }
    );
    job.status = "expired";
    job.expiredAt = new Date();

    await notify(NOTIFICATION_EVENTS.JOB_EXPIRED, {
      userId: job.postedBy,
      data: { jobTitle: job.title },
      meta: { jobId: job._id }
    });
  }
  return job;
};

const expireOverdueJobs = async () => {
  // Snapshot which jobs are about to expire BEFORE the bulk update —
  // updateMany() doesn't return the affected documents, and we need
  // postedBy + title for each one to notify correctly. Small race
  // window between this read and the write below is acceptable for a
  // cron job (worst case: a job that expires in that exact window is
  // picked up on the next run instead, one interval late).
  const jobsToExpire = await Job.find({
    status: "approved",
    deadline: { $ne: null, $lt: new Date() },
    isDeleted: false
  }).select("postedBy title").lean();

  const result = await Job.updateMany(
    {
      status: "approved",
      deadline: { $ne: null, $lt: new Date() },
      isDeleted: false
    },
    { $set: { status: "expired", expiredAt: new Date() } }
  );

  // notify() never throws, so Promise.all here is safe — one failed
  // notification can't take down the others or fail the cron job.
  await Promise.all(
    jobsToExpire.map((job) =>
      notify(NOTIFICATION_EVENTS.JOB_EXPIRED, {
        userId: job.postedBy,
        data: { jobTitle: job.title },
        meta: { jobId: job._id }
      })
    )
  );

  return {
    success: true,
    message: `${result.modifiedCount} job(s) marked expired`,
    data: { modifiedCount: result.modifiedCount }
  };
};

const featureJob = async (jobId, adminId, featured = true) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  job.metadata.featured = featured;
  await job.save();
  return {
    success: true,
    message: featured ? "Job marked as featured" : "Job removed from featured",
    data: { job }
  };
};

const verifyCompany = async (jobId, adminId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throw ApiError.notFound("Job not found");
  job.metadata.verifiedCompany = true;
  await job.save();
  return { success: true, message: "Company verified for this job", data: { job } };
};

const getApprovedJobs = async (filters = {}, viewer = {}) => {
  const { q, category, employmentType, isRemote, skill, page = 1, limit = 10 } = filters;
  const viewerProfile = await Profile.findOne({ userId: viewer.userId }).select("branch department").lean();
  const query = {
    status: "approved",
    isDeleted: false,
    isArchived: false
  };
  query.$and = [
    buildApprovedJobVisibilityQuery(viewerProfile),
    { $or: [{ deadline: null }, { deadline: { $gte: new Date() } }] }
  ];
  if (q) {
    const regex = new RegExp(q.trim(), "i");
    query.$and.push({
      $or: [
        { title: regex }, { company: regex },
        { description: regex }, { requiredSkills: regex }
      ]
    });
  }
  if (category) query.category = category;
  if (employmentType) query.employmentType = employmentType;
  if (isRemote !== undefined) query.isRemote = isRemote === "true";
  if (skill) query.requiredSkills = new RegExp(skill.trim(), "i");
  const skip = (Number(page) - 1) * Number(limit);
  const [rawJobs, total] = await Promise.all([
    Job.find(query)
      .sort({ "metadata.featured": -1, "metadata.priority": -1, approvedAt: -1, createdAt: -1 })
      .skip(skip).limit(Number(limit)).lean(),
    Job.countDocuments(query)
  ]);
  const jobs = [];
  for (const job of rawJobs) {
    if (await canUserAccessJob(job, viewer.userId, viewer.userRole, viewerProfile)) {
      jobs.push(job);
    }
  }
  return {
    jobs,
    pagination: {
      total, page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    }
  };
};

const getPendingJobs = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find({ status: "pending", isDeleted: false })
      .sort({ createdAt: 1 }).skip(skip).limit(Number(limit))
      .populate("postedBy", "username email role").lean(),
    Job.countDocuments({ status: "pending", isDeleted: false })
  ]);
  return { jobs, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getMyJobs = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [jobs, total] = await Promise.all([
    Job.find({ postedBy: userId, isDeleted: false })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Job.countDocuments({ postedBy: userId, isDeleted: false })
  ]);
  return { jobs, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getJobById = async (jobId, userId, userRole) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false })
    .populate("postedBy", "username fullName role");
  if (!job) throw ApiError.notFound("Job not found");
  const canAccess = await canUserAccessJob(job, userId, userRole);
  if (!canAccess) throw ApiError.notFound("Job not found");
  await expireJob(job);
  await Job.updateOne({ _id: jobId }, { $inc: { viewCount: 1 } });
  return job.toObject ? job.toObject() : job;
};

const getAnalytics = async (jobId, userId, userRole) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false }).lean();
  if (!job) throw ApiError.notFound("Job not found");
  const isOwner = job.postedBy.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("Not authorized to view analytics for this job");
  }
  const [totalApplications, acceptedCount, rejectedCount, shortlistedCount] = await Promise.all([
    JobApplication.countDocuments({ jobId }),
    JobApplication.countDocuments({ jobId, status: "accepted" }),
    JobApplication.countDocuments({ jobId, status: "rejected" }),
    JobApplication.countDocuments({ jobId, status: "shortlisted" })
  ]);
  const acceptanceRate = totalApplications > 0
    ? Number(((acceptedCount / totalApplications) * 100).toFixed(2))
    : 0;
  return {
    success: true,
    message: "Analytics fetched",
    data: {
      views: job.viewCount,
      clicks: job.analytics?.clicks || 0,
      shares: job.analytics?.shares || 0,
      bookmarks: job.analytics?.bookmarks || 0,
      totalApplications,
      shortlistedCount,
      acceptedCount,
      rejectedCount,
      acceptanceRate
    }
  };
};

module.exports = {
  createJob, updateJob, deleteJob,
  approveJob, rejectJob,
  closeJob, reopenJob, archiveJob,
  expireJob, expireOverdueJobs,
  featureJob, verifyCompany,
  getApprovedJobs, getPendingJobs, getMyJobs, getJobById,
  getAnalytics,
  canUserAccessJob,
  isJobPubliclyOpen
};
