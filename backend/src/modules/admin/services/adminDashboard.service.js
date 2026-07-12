// backend/src/modules/admin/services/adminDashboard.service.js
//
// EXCEPTION to "Admin never touches models directly": this file is
// pure READ-ONLY aggregation for the dashboard overview widgets. No
// document here is ever created/updated/deleted — only .countDocuments()
// calls. This mirrors how job.service.js's own getAnalytics() reads Job
// directly for stats; read-only analytics has always been acceptable in
// this codebase's convention, only WRITES must go through the owning
// module's service.

const User = require("../../auth/models/User");
const Job = require("../../jobs/models/Job");
const Event = require("../../events/models/Event");
const LearningResource = require("../../learning/models/LearningResource");
const MentorProfile = require("../../mentorship/models/MentorProfile");
const Community = require("../../communities/models/Community");
const FeedPost = require("../../feed/models/FeedPost");
const FeedReport = require("../../feed/models/FeedReport");

const { EVENT_STATUS } = require("../../events/constants/event.constants");
const { RESOURCE_STATUS } = require("../../learning/constants/resource.constants");
const { REPORT_STATUS } = require("../../feed/constants/feed.constants");
const { VERIFICATION_STATUS } = require("../../mentorship/constants/mentor.constants");
const { COMMUNITY_STATUS } = require("../../communities/constants/community.constants");

// ── Users breakdown ──────────────────────────────────────────────
const getUserStats = async () => {
  const [total, students, faculty, alumni, admins, pending, active, suspended, rejected] =
    await Promise.all([
      User.countDocuments({ isDeleted: false }),
      User.countDocuments({ isDeleted: false, role: "student" }),
      User.countDocuments({ isDeleted: false, role: "faculty" }),
      User.countDocuments({ isDeleted: false, role: "alumni" }),
      User.countDocuments({ isDeleted: false, role: "admin" }),
      User.countDocuments({ isDeleted: false, accountStatus: "pending" }),
      User.countDocuments({ isDeleted: false, accountStatus: "active" }),
      User.countDocuments({ isDeleted: false, accountStatus: "suspended" }),
      User.countDocuments({ isDeleted: false, accountStatus: "rejected" })
    ]);

  return { total, byRole: { students, faculty, alumni, admins }, byStatus: { pending, active, suspended, rejected } };
};

// ── Pending approvals across modules (lightweight counts only —
// full data comes from adminApproval.service.js's getUnifiedPendingQueue) ──
const getPendingCounts = async () => {
  const [jobs, events, resources, mentors, feedReports] = await Promise.all([
    Job.countDocuments({ status: "pending", isDeleted: false }),
    Event.countDocuments({ status: EVENT_STATUS.PENDING, isDeleted: false }),
    LearningResource.countDocuments({ status: RESOURCE_STATUS.PENDING }),
    MentorProfile.countDocuments({ verificationStatus: VERIFICATION_STATUS.PENDING }),
    FeedReport.countDocuments({ status: REPORT_STATUS.PENDING })
  ]);

  return { jobs, events, resources, mentors, feedReports, total: jobs + events + resources + mentors + feedReports };
};

// ── Today's activity ─────────────────────────────────────────────
const getTodayActivity = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [registrationsToday, loginsToday] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: startOfToday }, isDeleted: false }),
    User.countDocuments({ lastLoginAt: { $gte: startOfToday }, isDeleted: false })
  ]);

  return { registrationsToday, loginsToday };
};

// ── Platform-wide entity counts ──────────────────────────────────
const getEntityCounts = async () => {
  const [totalJobs, totalEvents, totalResources, totalMentors, totalCommunities, totalPosts] =
    await Promise.all([
      Job.countDocuments({ isDeleted: false }),
      Event.countDocuments({ isDeleted: false }),
      LearningResource.countDocuments({ isArchived: false }),
      MentorProfile.countDocuments({}),
      Community.countDocuments({ status: { $ne: COMMUNITY_STATUS.BANNED } }),
      FeedPost.countDocuments({ status: "active" })
    ]);

  return { totalJobs, totalEvents, totalResources, totalMentors, totalCommunities, totalPosts };
};

// ── Combined overview (single call for the dashboard home page) ──
const getDashboardOverview = async () => {
  const [users, pending, today, entities] = await Promise.all([
    getUserStats(),
    getPendingCounts(),
    getTodayActivity(),
    getEntityCounts()
  ]);

  return {
    success: true,
    message: "Dashboard overview fetched",
    data: { users, pending, today, entities }
  };
};

module.exports = {
  getUserStats,
  getPendingCounts,
  getTodayActivity,
  getEntityCounts,
  getDashboardOverview
};