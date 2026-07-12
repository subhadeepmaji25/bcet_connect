// backend/src/modules/learning/services/learningPath.service.js
//
// NEW MODULE — Learning (Career Learning domain, Phase 5).
// CRUD-only layer for LearningPath — same shape subject.service.js
// keeps for Subject (create/list/getById/update/archive), ownership
// checked via createdBy same as Subject's facultyId ownership pattern.
// No notify() calls — a path being created/edited is not a signal
// anyone else needs pushed to them, same restraint learningProgress.
// service.js already documents for its own actions.
//
// UPDATED (Phase 3 — Search integration): publishPath()/archivePath()
// now sync/remove the path's learningSearch.service.js index document —
// createPath() deliberately does NOT, since a path starts in DRAFT and
// listPaths() already hides DRAFT paths from students, so indexing it
// would let search leak content the browse endpoint itself hides (same
// reasoning documented inline at the sync call sites below).
// updatePath() re-syncs ONLY when the path is already PUBLISHED at the
// time of edit — editing a DRAFT still has nothing to sync.
//
// UPDATED (Phase 4 — Career Learning Path progress): added
// enrollInPath()/updateStepProgress()/getMyPathProgress(), the
// per-student mirror of learningProgress.service.js's markAsOpened()/
// updateProgress()/getMyProgress() — see LearningPathProgress.js's
// file header for why that tracking lives in its own collection
// rather than embedded here. enrolledCount on the LearningPath
// document itself is now genuinely incremented by enrollInPath() —
// previously nothing in this file ever wrote to it (see
// LearningPath.js's own inline comment on that field, which flagged
// this exact gap).

const LearningPath = require("../models/LearningPath");
const LearningPathProgress = require("../models/LearningPathProgress");
const { PATH_PROGRESS_STATUS } = LearningPathProgress;
const ApiError = require("../../../shared/errors/ApiError");
// NEW (Phase 3 — Search integration): same cross-module boundary
// discipline resource.service.js now keeps toward the Search module —
// only these two named sync entry points are ever called, this file
// never touches LearningSearchDocument directly.
const { syncPathSearchDocument, removePathSearchDocument } = require("../../search/services/learningSearch.service");

const MANAGER_ROLES = ["faculty", "admin"];

// Keeps LearningPath.skills in sync with the union of all step-level
// skillTags — this is the ONE place that derivation happens, so
// create/update can never accidentally drift the two apart.
const deriveSkillsFromSteps = (steps = []) => {
  const set = new Set();
  steps.forEach((step) => (step.skillTags || []).forEach((tag) => set.add(tag)));
  return Array.from(set);
};

const createPath = async (userId, userRole, payload) => {
  if (!MANAGER_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty or admin can create a learning path");
  }

  const steps = (payload.steps || []).slice().sort((a, b) => a.order - b.order);
  const skills = Array.from(new Set([...(payload.skills || []), ...deriveSkillsFromSteps(steps)]));

  const path = await LearningPath.create({
    title: payload.title,
    description: payload.description || "",
    careerTrack: payload.careerTrack,
    level: payload.level || "beginner",
    skills,
    prerequisites: payload.prerequisites || [],
    outcomeSkills: payload.outcomeSkills || [],
    steps,
    createdBy: userId,
    status: LearningPath.PATH_STATUS.DRAFT
  });

  return { success: true, message: "Learning path created as draft", data: { path } };
};

const updatePath = async (pathId, userId, userRole, payload) => {
  const path = await LearningPath.findOne({ _id: pathId, isArchived: false });
  if (!path) throw ApiError.notFound("Learning path not found");

  if (userRole !== "admin" && path.createdBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not own this learning path");
  }

  const fields = ["title", "description", "careerTrack", "level", "prerequisites", "outcomeSkills"];
  fields.forEach((field) => {
    if (payload[field] !== undefined) path[field] = payload[field];
  });

  if (payload.steps !== undefined) {
    path.steps = payload.steps.slice().sort((a, b) => a.order - b.order);
  }

  // Re-derive skills whenever either steps or an explicit skills list
  // changed — keeps the union invariant true after every edit, same
  // reasoning createPath() already applies.
  if (payload.steps !== undefined || payload.skills !== undefined) {
    path.skills = Array.from(new Set([...(payload.skills || path.skills), ...deriveSkillsFromSteps(path.steps)]));
  }

  await path.save();

  // NEW (Phase 3) — re-sync ONLY if this path is already visible to
  // students (PUBLISHED). A title/description/skills edit on a
  // PUBLISHED path must be reflected in search immediately; the same
  // edit on a DRAFT has nothing to sync, since a DRAFT was never
  // indexed in the first place (see file header).
  if (path.status === LearningPath.PATH_STATUS.PUBLISHED) {
    await syncPathSearchDocument(path._id);
  }

  return { success: true, message: "Learning path updated", data: { path } };
};

// DRAFT -> PUBLISHED is the only forward transition this function
// allows; PUBLISHED -> ARCHIVED is a separate, deliberate action
// (archivePath), never silently implied by an update.
const publishPath = async (pathId, userId, userRole) => {
  const path = await LearningPath.findOne({ _id: pathId, isArchived: false });
  if (!path) throw ApiError.notFound("Learning path not found");

  if (userRole !== "admin" && path.createdBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not own this learning path");
  }
  if (!path.steps.length) {
    throw ApiError.badRequest("Cannot publish a path with zero steps");
  }

  path.status = LearningPath.PATH_STATUS.PUBLISHED;
  await path.save();

  // NEW (Phase 3) — the moment a path becomes visible to students
  // (listPaths()'s PUBLISHED-only filter) is the exact moment it
  // should also become findable through search — same "index the
  // instant it's public, not on a delayed rebuild" timing
  // resource.service.js's uploadResource()/verifyResource() now follow.
  await syncPathSearchDocument(path._id);

  return { success: true, message: "Learning path published", data: { path } };
};

const archivePath = async (pathId, userId, userRole) => {
  const path = await LearningPath.findOne({ _id: pathId, isArchived: false });
  if (!path) throw ApiError.notFound("Learning path not found");

  if (userRole !== "admin" && path.createdBy.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not own this learning path");
  }

  path.status = LearningPath.PATH_STATUS.ARCHIVED;
  path.isArchived = true;
  await path.save();

  // NEW (Phase 3) — mirrors resource.service.js's deleteResource():
  // an archived path must disappear from search in the same request
  // that archives it. Safe to call even for a path that was still
  // DRAFT (never indexed) — the delete is a no-op in that case.
  await removePathSearchDocument(path._id);

  return { success: true, message: "Learning path archived", data: null };
};

// Public browse — students only ever see PUBLISHED paths, same gate
// resource.service.js's listResourcesForStudent() applies for
// LearningResource.status.
const listPaths = async ({ careerTrack, skill, page = 1, limit = 20 } = {}) => {
  const filter = { status: LearningPath.PATH_STATUS.PUBLISHED, isArchived: false };
  if (careerTrack) filter.careerTrack = careerTrack;
  if (skill) filter.skills = skill;

  const skip = (Number(page) - 1) * Number(limit);
  const [paths, total] = await Promise.all([
    LearningPath.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    LearningPath.countDocuments(filter)
  ]);

  return { paths, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getMyPaths = async (userId, userRole, { page = 1, limit = 20 } = {}) => {
  const filter = userRole === "admin" ? { isArchived: false } : { createdBy: userId, isArchived: false };
  const skip = (Number(page) - 1) * Number(limit);
  const [paths, total] = await Promise.all([
    LearningPath.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    LearningPath.countDocuments(filter)
  ]);
  return { paths, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getPathById = async (pathId) => {
  const path = await LearningPath.findOne({ _id: pathId, isArchived: false })
    .populate("createdBy", "username fullName role")
    .populate("steps.resourceId", "title type")
    .lean();
  if (!path) throw ApiError.notFound("Learning path not found");
  return path;
};

// ── Phase 4 — Enrollment & step progress ────────────────────────────
//
// A student may only enroll in a path that is currently PUBLISHED and
// not archived — same visibility gate listPaths()/getPathById() apply
// for browsing, applied here too so enrollment can never be the
// backdoor that lets a student "discover" a DRAFT path's existence.
const assertEnrollablePath = async (pathId) => {
  const path = await LearningPath.findOne({
    _id: pathId,
    status: LearningPath.PATH_STATUS.PUBLISHED,
    isArchived: false
  })
    .select("_id steps")
    .lean();
  if (!path) throw ApiError.notFound("Learning path not found");
  return path;
};

// Idempotent — calling this again for an already-enrolled student
// returns the existing progress record unchanged rather than erroring,
// same "re-opening something you already started is fine" tolerance
// learningProgress.service.js's markAsOpened() shows via its own
// upsert. enrolledCount is incremented EXACTLY ONCE per student, on
// the genuine first enrollment — this is the check that guards it: a
// second call finds `existing` and returns early before ever reaching
// the $inc below, so enrolledCount can never be double-counted by a
// student re-hitting this endpoint.
const enrollInPath = async (userId, pathId) => {
  await assertEnrollablePath(pathId);

  const existing = await LearningPathProgress.findOne({ userId, pathId }).lean();
  if (existing) {
    return { success: true, message: "Already enrolled in this learning path", data: { progress: existing } };
  }

  const progress = await LearningPathProgress.create({
    userId,
    pathId,
    status: PATH_PROGRESS_STATUS.STARTED,
    completionPercent: 0,
    completedStepIds: [],
    enrolledAt: new Date(),
    lastActivityAt: new Date()
  });

  await LearningPath.updateOne({ _id: pathId }, { $inc: { enrolledCount: 1 } });

  return { success: true, message: "Enrolled in learning path", data: { progress } };
};

// Toggles ONE step's completion state and recomputes the whole
// record's completionPercent/status from completedStepIds — same
// "recompute the aggregate from the source of truth on every write"
// discipline updateProgress() applies to LearningProgress.completionPercent,
// just driven by an array length here instead of a client-supplied number.
const updateStepProgress = async (userId, pathId, stepId, { completed } = {}) => {
  const path = await assertEnrollablePath(pathId);

  const stepExists = path.steps.some((step) => step._id.toString() === stepId.toString());
  if (!stepExists) throw ApiError.badRequest("Step does not belong to this learning path");

  const progress = await LearningPathProgress.findOne({ userId, pathId });
  if (!progress) throw ApiError.notFound("Enroll in this learning path before updating step progress");

  const alreadyCompleted = progress.completedStepIds.some((id) => id.toString() === stepId.toString());

  if (completed && !alreadyCompleted) {
    progress.completedStepIds.push(stepId);
  } else if (!completed && alreadyCompleted) {
    progress.completedStepIds = progress.completedStepIds.filter((id) => id.toString() !== stepId.toString());
  }

  const totalSteps = path.steps.length;
  const completionPercent = totalSteps === 0 ? 0 : Math.round((progress.completedStepIds.length / totalSteps) * 100);
  progress.completionPercent = completionPercent;

  if (completionPercent >= 100) {
    if (progress.status !== PATH_PROGRESS_STATUS.COMPLETED) progress.completedAt = new Date();
    progress.status = PATH_PROGRESS_STATUS.COMPLETED;
  } else if (completionPercent > 0) {
    progress.status = PATH_PROGRESS_STATUS.IN_PROGRESS;
    progress.completedAt = null;
  } else {
    progress.status = PATH_PROGRESS_STATUS.STARTED;
    progress.completedAt = null;
  }

  progress.lastActivityAt = new Date();
  await progress.save();

  return { success: true, message: "Step progress updated", data: { progress } };
};

const getMyPathProgress = async (userId, pathId) => {
  const progress = await LearningPathProgress.findOne({ userId, pathId }).lean();
  return progress || null;
};

module.exports = {
  createPath,
  updatePath,
  publishPath,
  archivePath,
  listPaths,
  getMyPaths,
  getPathById,
  enrollInPath, // NEW (Phase 4)
  updateStepProgress, // NEW (Phase 4)
  getMyPathProgress // NEW (Phase 4)
};