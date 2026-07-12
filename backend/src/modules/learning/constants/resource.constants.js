// backend/src/modules/learning/constants/resource.constants.js
//
// NEW MODULE — Learning (Academic Learning domain, Phase 1).
// See file header reasoning already established: status lifecycle
// mirrors Job's pending→approved shape, visibility mirrors Community's
// enum-of-scopes shape. No changes needed here for the CR-role fix —
// that fix lives entirely in resource.service.js's resolveUploaderRole(),
// this file's canAutoPublish()/getInitialStatus() already correctly
// expect a resolved uploaderRole ("faculty"/"cr"/"admin"), never the
// raw auth role. The bug was in resource.service.js calling these with
// the WRONG input (raw auth role), not in these functions themselves.

const RESOURCE_TYPE = Object.freeze({
  NOTE: "note",
  VIDEO_LINK: "video_link",
  ASSIGNMENT: "assignment",
  LAB: "lab",
  PYQ: "pyq",
  PPT: "ppt",
  BOOK: "book",
  REFERENCE_LINK: "reference_link"
});
const RESOURCE_TYPE_VALUES = Object.freeze(Object.values(RESOURCE_TYPE));

const LINK_ONLY_TYPES = Object.freeze([RESOURCE_TYPE.VIDEO_LINK, RESOURCE_TYPE.REFERENCE_LINK]);

const VISIBILITY = Object.freeze({
  PUBLIC: "public",
  DEPARTMENT: "department",
  SEMESTER: "semester",
  SECTION: "section"
});
const VISIBILITY_VALUES = Object.freeze(Object.values(VISIBILITY));

const RESOURCE_STATUS = Object.freeze({
  PENDING: "pending",
  PUBLISHED: "published",
  REJECTED: "rejected",
  ARCHIVED: "archived"
});
const RESOURCE_STATUS_VALUES = Object.freeze(Object.values(RESOURCE_STATUS));

// uploaderRole is a RESOLVED role, never the raw auth role. Auth roles
// (auth/models/User.js USER_ROLES) are ["student","faculty","alumni","admin"] —
// "cr" does NOT exist there. A CR is a student with Profile.isCR === true.
// resource.service.js's resolveUploaderRole() is the ONLY place that is
// allowed to turn a raw auth role into one of these three values —
// nothing else in this module should compare req.user.role directly
// against UPLOADER_ROLE.CR, because that comparison will always be false.
const UPLOADER_ROLE = Object.freeze({
  FACULTY: "faculty",
  CR: "cr",
  ADMIN: "admin"
});
const UPLOADER_ROLE_VALUES = Object.freeze(Object.values(UPLOADER_ROLE));

const DIFFICULTY = Object.freeze({
  BEGINNER: "beginner",
  INTERMEDIATE: "intermediate",
  ADVANCED: "advanced"
});
const DIFFICULTY_VALUES = Object.freeze(Object.values(DIFFICULTY));

const canAutoPublish = (uploaderRole) =>
  uploaderRole === UPLOADER_ROLE.FACULTY || uploaderRole === UPLOADER_ROLE.ADMIN;

const getInitialStatus = (uploaderRole) =>
  canAutoPublish(uploaderRole) ? RESOURCE_STATUS.PUBLISHED : RESOURCE_STATUS.PENDING;

const UPLOAD_ALLOWED_ROLES = Object.freeze([UPLOADER_ROLE.FACULTY, UPLOADER_ROLE.CR, UPLOADER_ROLE.ADMIN]);

const VERIFY_ALLOWED_ROLES = Object.freeze([UPLOADER_ROLE.FACULTY, UPLOADER_ROLE.ADMIN]);

module.exports = {
  RESOURCE_TYPE,
  RESOURCE_TYPE_VALUES,
  LINK_ONLY_TYPES,
  VISIBILITY,
  VISIBILITY_VALUES,
  RESOURCE_STATUS,
  RESOURCE_STATUS_VALUES,
  UPLOADER_ROLE,
  UPLOADER_ROLE_VALUES,
  DIFFICULTY,
  DIFFICULTY_VALUES,
  canAutoPublish,
  getInitialStatus,
  UPLOAD_ALLOWED_ROLES,
  VERIFY_ALLOWED_ROLES
};