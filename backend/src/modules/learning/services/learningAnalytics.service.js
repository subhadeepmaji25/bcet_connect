// backend/src/modules/learning/services/learningAnalytics.service.js
//
// NEW MODULE — Learning (Learning Analytics domain, Phase 5).
//
// PURE READ-ONLY aggregation service — owns NO model, writes NOTHING,
// same restraint mentorReview.service.js's recalculateMentorRating()
// shows toward MentorProfile (reads broadly, writes narrowly). This
// file computes everything on-demand from counters/collections that
// already exist (LearningResource.viewCount/downloadCount/ratingAverage,
// ResourceBookmark, LearningProgress, SubjectDiscussion) — NO new
// denormalized fields were added anywhere to support this file. That is
// a deliberate choice: analytics-on-read is slightly more DB work per
// dashboard load, but a dashboard is read far less often than a
// resource is viewed/downloaded, so adding write-path complexity
// (another counter to keep in sync on every action) to shave aggregate
// query time here would be the wrong trade — the exact inverse of why
// viewCount/downloadCount ARE denormalized (those ARE read constantly).
//
// Ownership: every Faculty-facing function here takes the ACTING
// user's id/role and re-validates ownership via
// subject.service.js's assertSubjectOwnership() — never trusts a
// subjectId was already checked by the caller, same defensive stance
// resource.service.js's verifyResource() already takes.

const mongoose = require("mongoose");
const Subject = require("../models/Subject");
const LearningResource = require("../models/LearningResource");
const ResourceBookmark = require("../models/ResourceBookmark");
const LearningProgress = require("../models/LearningProgress");
const SubjectDiscussion = require("../models/SubjectDiscussion");
const ApiError = require("../../../shared/errors/ApiError");
const { assertSubjectOwnership } = require("./subject.service");
const { RESOURCE_STATUS } = require("../constants/resource.constants");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// ── Faculty dashboard: single subject ──────────────────────────────
//
// "Top Resource / Most Downloaded / Most Viewed / Average Rating /
// Completion / Engagement" — everything the brainstorm doc's Learning
// Analytics section asked for, for ONE subject a Faculty owns.
const getSubjectAnalytics = async (subjectId, userId, userRole) => {
  if (userRole !== "admin") {
    await assertSubjectOwnership(subjectId, userId);
  }

  const resourceFilter = { subjectId: toObjectId(subjectId), isArchived: false };

  const [
    resourceStats,
    topByDownloads,
    topByViews,
    topByRating,
    progressStats,
    discussionStats
  ] = await Promise.all([
    // Subject-wide totals in one pass — avoids 5 separate COUNT/SUM
    // queries against the same collection.
    LearningResource.aggregate([
      { $match: resourceFilter },
      {
        $group: {
          _id: null,
          totalResources: { $sum: 1 },
          totalViews: { $sum: "$viewCount" },
          totalDownloads: { $sum: "$downloadCount" },
          totalBookmarks: { $sum: "$bookmarkCount" },
          avgRating: { $avg: "$ratingAverage" },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", RESOURCE_STATUS.PENDING] }, 1, 0] }
          }
        }
      }
    ]),
    LearningResource.find(resourceFilter).sort({ downloadCount: -1 }).limit(5)
      .select("title type downloadCount").lean(),
    LearningResource.find(resourceFilter).sort({ viewCount: -1 }).limit(5)
      .select("title type viewCount").lean(),
    LearningResource.find({ ...resourceFilter, ratingCount: { $gt: 0 } })
      .sort({ ratingAverage: -1, ratingCount: -1 }).limit(5)
      .select("title type ratingAverage ratingCount").lean(),
    // Completion breakdown across ALL resources in this subject —
    // resolves the resource id list first (LearningProgress has no
    // subjectId of its own, by design — see LearningProgress.js, it
    // only knows userId/resourceId), same two-step join style
    // resource.service.js's listPendingForFaculty() already uses
    // (subjectIds -> resourceId $in).
    LearningResource.find(resourceFilter).select("_id").lean().then((resources) => {
      const resourceIds = resources.map((r) => r._id);
      if (!resourceIds.length) return [];
      return LearningProgress.aggregate([
        { $match: { resourceId: { $in: resourceIds } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
    }),
    SubjectDiscussion.aggregate([
      { $match: { subjectId: toObjectId(subjectId), parentDiscussionId: null, status: "active" } },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          solvedQuestions: { $sum: { $cond: [{ $ne: ["$acceptedAnswerId", null] }, 1, 0] } }
        }
      }
    ])
  ]);

  const totals = resourceStats[0] || {
    totalResources: 0, totalViews: 0, totalDownloads: 0, totalBookmarks: 0, avgRating: 0, pendingCount: 0
  };

  const completion = { started: 0, in_progress: 0, completed: 0 };
  progressStats.forEach((row) => { completion[row._id] = row.count; });

  const discussion = discussionStats[0] || { totalQuestions: 0, solvedQuestions: 0 };

  return {
    success: true,
    message: "Subject analytics fetched successfully",
    data: {
      totals: {
        ...totals,
        avgRating: Math.round((totals.avgRating || 0) * 10) / 10
      },
      topResources: { byDownloads: topByDownloads, byViews: topByViews, byRating: topByRating },
      studentCompletion: completion,
      discussion
    }
  };
};

// ── Faculty dashboard: across all owned subjects ───────────────────
//
// "Weak Subject / Popular Topic / Trend" at a glance — which of MY
// subjects has the lowest completion rate or lowest average rating,
// surfaced without opening each one individually.
const getFacultyOverview = async (userId, userRole) => {
  const subjectFilter = userRole === "admin" ? { isArchived: false } : { facultyId: userId, isArchived: false };
  const subjects = await Subject.find(subjectFilter).select("_id name code resourceCount").lean();
  if (!subjects.length) {
    return { success: true, message: "No subjects found", data: { subjects: [] } };
  }

  const subjectIds = subjects.map((s) => s._id);

  // One aggregation across ALL owned subjects, grouped back down per
  // subject — avoids an N+1 loop calling getSubjectAnalytics() per
  // subject (that function is for the detailed single-subject drill-
  // down view; this one is the lightweight multi-subject summary row).
  const perSubjectStats = await LearningResource.aggregate([
    { $match: { subjectId: { $in: subjectIds }, isArchived: false } },
    {
      $group: {
        _id: "$subjectId",
        totalViews: { $sum: "$viewCount" },
        totalDownloads: { $sum: "$downloadCount" },
        avgRating: { $avg: "$ratingAverage" }
      }
    }
  ]);
  const statsBySubjectId = new Map(perSubjectStats.map((row) => [row._id.toString(), row]));

  const overview = subjects.map((subject) => {
    const stats = statsBySubjectId.get(subject._id.toString()) || { totalViews: 0, totalDownloads: 0, avgRating: 0 };
    return {
      subjectId: subject._id,
      name: subject.name,
      code: subject.code,
      resourceCount: subject.resourceCount,
      totalViews: stats.totalViews,
      totalDownloads: stats.totalDownloads,
      avgRating: Math.round((stats.avgRating || 0) * 10) / 10
    };
  });

  // Sorted worst-rated-first so a Faculty immediately sees which
  // subject needs attention — directly answers the brainstorm doc's
  // "Weak Subject" ask without a separate endpoint.
  overview.sort((a, b) => a.avgRating - b.avgRating);

  return { success: true, message: "Faculty overview fetched successfully", data: { subjects: overview } };
};

// ── Student-facing: personal learning stats ────────────────────────
//
// "Learning Hours / Resources Completed / Bookmarks / Progress" —
// Certificates deliberately excluded, brainstorm doc itself marks that
// as future scope, no model exists for it yet.
const getMyLearningStats = async (userId) => {
  const [progressStats, bookmarkCount, discussionCount] = await Promise.all([
    LearningProgress.aggregate([
      { $match: { userId: toObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalResourcesTouched: { $sum: 1 },
          totalCompleted: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          totalOpens: { $sum: "$openCount" }
        }
      }
    ]),
    ResourceBookmark.countDocuments({ userId }),
    SubjectDiscussion.countDocuments({ authorId: userId, status: "active" })
  ]);

  const stats = progressStats[0] || { totalResourcesTouched: 0, totalCompleted: 0, totalOpens: 0 };

  return {
    success: true,
    message: "Your learning stats fetched successfully",
    data: {
      resourcesStarted: stats.totalResourcesTouched,
      resourcesCompleted: stats.totalCompleted,
      totalOpens: stats.totalOpens,
      bookmarksCount: bookmarkCount,
      discussionContributions: discussionCount
      // NOTE: "Learning Hours" from the brainstorm doc is intentionally
      // NOT returned here — LearningProgress.js has no time-spent field
      // (only openCount/lastOpenedAt/completionPercent), so an actual
      // hours figure would have to be invented/estimated, which this
      // service refuses to fabricate. Add a `timeSpentSeconds` field to
      // LearningProgress.js first (a real, tracked number) before this
      // function can honestly report hours.
    }
  };
};

module.exports = {
  getSubjectAnalytics,
  getFacultyOverview,
  getMyLearningStats
};