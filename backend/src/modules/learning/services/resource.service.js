// backend/src/modules/learning/services/resource.service.js
//
// UPDATED (Phase 3 — Search integration): hooked the three moments a
// resource's public visibility actually changes — auto-publish on
// upload, verifyResource() deciding "verified"/"rejected", and
// deleteResource()'s archive — into learningSearch.service.js's sync
// functions. This is the ONLY place those hooks belong: every other
// read path (listResourcesForStudent/Staff, getMyUploads, etc.) is a
// pure read and never changes status, so it has nothing to sync.
// learningSearch.service.js does its own independent re-fetch of the
// resource rather than trusting a shape passed in here, and —
// critically — never throws back into this file (see that file's
// try/catch discipline). A search-index failure must never fail a
// resource upload/verify/delete.
const LearningResource = require("../models/LearningResource");
const Subject = require("../models/Subject");
const Profile = require("../../users/models/Profile");
const ApiError = require("../../../shared/errors/ApiError");
const { uploadMedia, deleteMedia, cleanupLocalFile } = require("../../../shared/media/media.service");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const { assertSubjectOwnership } = require("./subject.service");
const {
  VISIBILITY,
  RESOURCE_STATUS,
  LINK_ONLY_TYPES,
  UPLOADER_ROLE,
  VERIFY_ALLOWED_ROLES,
  getInitialStatus
} = require("../constants/resource.constants");
// NEW (Phase 3) — the Search module owns its own index; Learning only
// ever calls the two sync entry points, never touches
// LearningSearchDocument directly. Same cross-module boundary
// discipline resource.service.js already keeps toward Subject (via
// subject.service.js's assertSubjectOwnership, not a raw Subject
// query) instead of reaching into another module's internals.
const { syncResourceSearchDocument, removeResourceSearchDocument } = require("../../search/services/learningSearch.service");

const isElevatedViewer = (userRole) => userRole === "admin";

const normalizeUploadedFile = (file = {}) => ({
  buffer: file.buffer,
  filePath: file.path,
  mimeType: file.mimetype || file.mimeType,
  sizeInBytes: file.size || file.sizeInBytes,
  originalName: file.originalname || file.originalName || ""
});

const buildVisibilityAccessQuery = (viewerProfile) => ({
  $or: [
    { visibility: VISIBILITY.PUBLIC },
    { visibility: VISIBILITY.DEPARTMENT, department: viewerProfile.department },
    { visibility: VISIBILITY.SEMESTER, department: viewerProfile.department, semester: viewerProfile.semester },
    {
      visibility: VISIBILITY.SECTION,
      department: viewerProfile.department,
      semester: viewerProfile.semester,
      section: viewerProfile.section
    }
  ]
});

const canProfileAccessPublishedResource = (resource, viewerProfile = {}) => {
  if (resource.visibility === VISIBILITY.PUBLIC) return true;
  if (!viewerProfile.department) return false;
  if (resource.visibility === VISIBILITY.DEPARTMENT) {
    return resource.department === viewerProfile.department;
  }
  if (resource.visibility === VISIBILITY.SEMESTER) {
    return resource.department === viewerProfile.department
      && Number(resource.semester) === Number(viewerProfile.semester);
  }
  if (resource.visibility === VISIBILITY.SECTION) {
    return resource.department === viewerProfile.department
      && Number(resource.semester) === Number(viewerProfile.semester)
      && String(resource.section || "") === String(viewerProfile.section || "");
  }
  return false;
};

const assertCanAccessResource = async (resourceId, userId, userRole, { includeUnpublishedForOwner = true } = {}) => {
  const resource = await LearningResource.findOne({ _id: resourceId, isArchived: false });
  if (!resource) throw ApiError.notFound("Resource not found");

  const isOwner = resource.uploaderId.toString() === userId.toString();
  if (isOwner && includeUnpublishedForOwner) {
    return resource;
  }

  if (isElevatedViewer(userRole)) {
    return resource;
  }

  const subject = await Subject.findById(resource.subjectId).select("facultyId").lean();
  if (userRole === "faculty" && subject?.facultyId?.toString() === userId.toString()) {
    return resource;
  }

  if (resource.status !== RESOURCE_STATUS.PUBLISHED) {
    throw ApiError.notFound("Resource not found");
  }

  const viewerProfile = await Profile.findOne({ userId }).select("department semester section").lean();
  if (!viewerProfile || !canProfileAccessPublishedResource(resource, viewerProfile)) {
    throw ApiError.forbidden("You do not have access to this resource");
  }

  return resource;
};

// ── Role resolution ──────────────────────────────────────────────
const resolveUploaderRole = async (userId, authRole) => {
  if (authRole === "faculty") return UPLOADER_ROLE.FACULTY;
  if (authRole === "admin") return UPLOADER_ROLE.ADMIN;

  if (authRole === "student") {
    const profile = await Profile.findOne({ userId }).select("isCR").lean();
    if (profile?.isCR) return UPLOADER_ROLE.CR;
  }

  throw ApiError.forbidden("Only faculty, class representatives, or admin can upload resources");
};

// ── Upload ──────────────────────────────────────────────────────────
const uploadResource = async (userId, authRole, payload, file) => {
  const resolvedRole = await resolveUploaderRole(userId, authRole);

  const subject = await Subject.findOne({ _id: payload.subjectId, isArchived: false }).lean();
  if (!subject) throw ApiError.notFound("Subject not found");

  const department = subject.department;
  const semester = subject.semester;

  let section = payload.section || "";
  if (payload.visibility === VISIBILITY.SECTION && !section) {
    const uploaderProfile = await Profile.findOne({ userId }).select("section").lean();
    section = uploaderProfile?.section || "";
  }

  const isLinkOnly = LINK_ONLY_TYPES.includes(payload.type);

  let fileData = null;
  if (!isLinkOnly) {
    if (!file) throw ApiError.badRequest("A file is required for this resource type");
    const uploadFile = normalizeUploadedFile(file);
    try {
      const uploaded = await uploadMedia(MEDIA_TYPES.LEARNING_RESOURCE, userId, uploadFile);
      fileData = {
        url: uploaded.url,
        publicId: uploaded.publicId,
        mimeType: uploadFile.mimeType,
        size: uploaded.bytes,
        originalName: uploaded.originalName || ""
      };
    } finally {
      await cleanupLocalFile(uploadFile.filePath, { module: "Learning", userId });
    }
  }

  const status = getInitialStatus(resolvedRole);

  const resource = await LearningResource.create({
    title: payload.title,
    description: payload.description,
    type: payload.type,
    subjectId: subject._id,
    department,
    semester,
    section,
    visibility: payload.visibility || VISIBILITY.DEPARTMENT,
    file: fileData,
    externalUrl: isLinkOnly ? payload.externalUrl : "",
    uploaderId: userId,
    uploaderRole: resolvedRole,
    status,
    tags: payload.tags || [],
    difficulty: payload.difficulty || null,
    estimatedTimeMinutes: payload.estimatedTimeMinutes ?? null
  });

  await Subject.updateOne({ _id: subject._id }, { $inc: { resourceCount: 1 } });

  if (status !== RESOURCE_STATUS.PUBLISHED) {
    await notify(NOTIFICATION_EVENTS.RESOURCE_PENDING_VERIFICATION, {
      userId: subject.facultyId,
      data: { resourceTitle: resource.title, subjectName: subject.name },
      meta: { resourceId: resource._id, subjectId: subject._id }
    });
  } else {
    // NEW (Phase 3) — Faculty/Admin uploads auto-publish (getInitialStatus()
    // above), so THIS is the moment it first becomes searchable, not just
    // visible on the Resources list. A CR/student upload skips this branch
    // entirely — it stays PENDING until verifyResource() below decides.
    await syncResourceSearchDocument(resource._id);
  }

  return {
    success: true,
    message: status === RESOURCE_STATUS.PUBLISHED
      ? "Resource published successfully"
      : "Resource submitted and awaiting faculty verification",
    data: { resource }
  };
};

// ── Verification (Faculty/Admin only) ──────────────────────────────
const verifyResource = async (resourceId, userId, userRole, decision, rejectionReason = "") => {
  if (!VERIFY_ALLOWED_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty or admin can verify resources");
  }

  const resource = await LearningResource.findOne({ _id: resourceId, isArchived: false });
  if (!resource) throw ApiError.notFound("Resource not found");

  if (resource.status !== RESOURCE_STATUS.PENDING) {
    throw ApiError.badRequest(`Resource is already ${resource.status}`);
  }

  if (userRole !== "admin") {
    await assertSubjectOwnership(resource.subjectId, userId);
  }

  if (decision === "verified") {
    resource.status = RESOURCE_STATUS.PUBLISHED;
    resource.verifiedBy = userId;
    resource.verifiedAt = new Date();
    resource.rejectionReason = "";
  } else if (decision === "rejected") {
    resource.status = RESOURCE_STATUS.REJECTED;
    resource.verifiedBy = userId;
    resource.verifiedAt = new Date();
    resource.rejectionReason = rejectionReason;
  } else {
    throw ApiError.badRequest('decision must be "verified" or "rejected"');
  }

  await resource.save();

  await notify(
    decision === "verified" ? NOTIFICATION_EVENTS.RESOURCE_VERIFIED : NOTIFICATION_EVENTS.RESOURCE_REJECTED,
    {
      userId: resource.uploaderId,
      data: { resourceTitle: resource.title, rejectionReason: resource.rejectionReason },
      meta: { resourceId: resource._id }
    }
  );

  // NEW (Phase 3) — this is the CR/student upload path's equivalent of
  // the auto-publish branch in uploadResource() above: the only other
  // moment a resource transitions into (or definitively away from)
  // PUBLISHED. "rejected" calls removeResourceSearchDocument() as a
  // defensive no-op in the normal case (a PENDING resource was never
  // indexed to begin with) — cheap insurance against the rare case
  // where a resource was verified, later somehow reverted, and
  // re-verified as rejected, so no stale index entry can survive.
  if (decision === "verified") {
    await syncResourceSearchDocument(resource._id);
  } else {
    await removeResourceSearchDocument(resource._id);
  }

  return {
    success: true,
    message: decision === "verified" ? "Resource verified and published" : "Resource rejected",
    data: { resource }
  };
};
const listResourcesForStudent = async (userId, filters = {}) => {
  const { subjectId, type, page = 1, limit = 20 } = filters;

  const viewerProfile = await Profile.findOne({ userId }).select("department semester section").lean();
  if (!viewerProfile) throw ApiError.notFound("Profile not found");

  const query = {
    status: RESOURCE_STATUS.PUBLISHED,
    isArchived: false,
    ...buildVisibilityAccessQuery(viewerProfile)
  };
  if (subjectId) query.subjectId = subjectId;
  if (type) query.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [resources, total] = await Promise.all([
    LearningResource.find(query)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("uploaderId", "username fullName role")
      .lean(),
    LearningResource.countDocuments(query)
  ]);

  return {
    resources,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};
const listResourcesForStaff = async (userId, userRole, filters = {}) => {
  const { subjectId, department, semester, type, page = 1, limit = 20 } = filters;

  const query = { status: RESOURCE_STATUS.PUBLISHED, isArchived: false };

  if (userRole === "admin") {
    if (subjectId) query.subjectId = subjectId;
  } else {
    const mySubjects = await Subject.find({ facultyId: userId }).select("_id").lean();
    const mySubjectIds = mySubjects.map((s) => s._id);
    query.subjectId = subjectId
      ? { $in: mySubjectIds.filter((id) => id.toString() === subjectId) }
      : { $in: mySubjectIds };
  }

  if (department) query.department = department;
  if (semester) query.semester = Number(semester);
  if (type) query.type = type;

  const skip = (Number(page) - 1) * Number(limit);
  const [resources, total] = await Promise.all([
    LearningResource.find(query)
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
      .populate("uploaderId", "username fullName role")
      .populate("subjectId", "name code department semester")
      .lean(),
    LearningResource.countDocuments(query)
  ]);

  return {
    resources,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

const listPendingForFaculty = async (userId, userRole, { page = 1, limit = 20 } = {}) => {
  const subjectFilter = userRole === "admin" ? {} : { facultyId: userId };
  const mySubjects = await Subject.find(subjectFilter).select("_id").lean();
  const subjectIds = mySubjects.map((s) => s._id);

  const skip = (Number(page) - 1) * Number(limit);
  const [resources, total] = await Promise.all([
    LearningResource.find({ subjectId: { $in: subjectIds }, status: RESOURCE_STATUS.PENDING })
      .sort({ createdAt: 1 }).skip(skip).limit(Number(limit))
      .populate("uploaderId", "username fullName role")
      .populate("subjectId", "name code")
      .lean(),
    LearningResource.countDocuments({ subjectId: { $in: subjectIds }, status: RESOURCE_STATUS.PENDING })
  ]);

  return { resources, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getMyUploads = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [resources, total] = await Promise.all([
    LearningResource.find({ uploaderId: userId, isArchived: false })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    LearningResource.countDocuments({ uploaderId: userId, isArchived: false })
  ]);
  return { resources, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const getResourceById = async (resourceId, userId, userRole) => {
  await assertCanAccessResource(resourceId, userId, userRole);
  const resource = await LearningResource.findOne({ _id: resourceId, isArchived: false })
    .populate("uploaderId", "username fullName role")
    .populate("subjectId", "name code department semester");
  if (!resource) throw ApiError.notFound("Resource not found");

  await LearningResource.updateOne({ _id: resourceId }, { $inc: { viewCount: 1 } });

  return resource.toObject ? resource.toObject() : resource;
};

// ── Delete ──────────────────────────────────────────────────────────
const deleteResource = async (resourceId, userId, userRole) => {
  const resource = await LearningResource.findOne({ _id: resourceId, isArchived: false });
  if (!resource) throw ApiError.notFound("Resource not found");

  const isOwner = resource.uploaderId.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot delete this resource");
  }

  resource.isArchived = true;
  await resource.save();

  if (resource.file?.publicId) {
    await deleteMedia(MEDIA_TYPES.LEARNING_RESOURCE, resource.file.publicId);
  }

  await Subject.updateOne({ _id: resource.subjectId }, { $inc: { resourceCount: -1 } });

  // NEW (Phase 3) — an archived resource must disappear from search
  // results in the same request that archives it, not linger until
  // some future rebuild. Safe to call unconditionally even for a
  // resource that was never PUBLISHED (PENDING/REJECTED) — the delete
  // is a no-op in that case, same defensive-no-op reasoning used in
  // verifyResource()'s "rejected" branch above.
  await removeResourceSearchDocument(resource._id);

  return { success: true, message: "Resource deleted successfully", data: null };
};

module.exports = {
  resolveUploaderRole,
  uploadResource,
  verifyResource,
  listResourcesForStudent,
  listResourcesForStaff, // NEW
  listPendingForFaculty,
  getMyUploads,
  getResourceById,
  deleteResource,
  assertCanAccessResource
};
