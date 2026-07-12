// backend/src/modules/users/routes/user.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../../../shared/middlewares/auth.middleware");
const { allowRoles } = require("../../../shared/middlewares/roleMiddleware");
const { createUploadMiddleware } = require("../../../shared/middlewares/upload.middleware");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");

const {
  updateProfileController,
  getMyProfileController,
  getPublicProfileController,
  updateLastActiveController,
  uploadAvatarController,
  deleteAvatarController,
  setCRStatusController, // NEW (Phase 1a)
} = require("../controllers/profile.controller");
const {
  addSkillController,
  bulkAddSkillsController,
  updateSkillController,
  deleteSkillController,
  getUserSkillsController,
  getSkillByIdController,
} = require("../controllers/skill.controller");
const { addEducationController, updateEducationController, deleteEducationController, getUserEducationsController, getEducationByIdController } = require("../controllers/education.controller");
const { addExperienceController, updateExperienceController, deleteExperienceController, getUserExperiencesController, getExperienceByIdController } = require("../controllers/experience.controller");
const { addProjectController, updateProjectController, deleteProjectController, getUserProjectsController, getPublicProjectsController, getProjectByIdController } = require("../controllers/project.controller");
const {
  uploadResumeController,
  replaceResumeController,
  updateResumeController,
  deleteResumeController,
  getUserResumesController,
  getDefaultResumeController
} = require("../controllers/resume.controller");

const { validateUpdateProfile, validateSetCRStatusParam, validateSetCRStatus } = require("../validators/profile.validator"); // UPDATED
const { validateCreateSkill, validateUpdateSkill, validateBulkAddSkills } = require("../validators/skill.validator");
const { validateCreateEducation, validateUpdateEducation } = require("../validators/education.validator");
const { validateCreateExperience, validateUpdateExperience } = require("../validators/experience.validator");
const { validateCreateProject, validateUpdateProject } = require("../validators/project.validator");
const { validateUpdateResume } = require("../validators/resume.validator");
const { uploadLimiter, jobActionLimiter } = require("../../../shared/security/rateLimiters");

router.get("/profile", authMiddleware, getMyProfileController);
router.patch("/profile", authMiddleware, validateUpdateProfile, updateProfileController);
router.patch("/profile/activity", authMiddleware, updateLastActiveController);

// ─────────────────────────────────────────
// FIX: authMiddleware added — getPublicProfile(viewerId, targetUserId)
// now needs req.user.id as the viewer. Without this middleware, req.user
// would be undefined and the controller would crash (or silently pass
// viewerId=undefined, which was the earlier regression).
// ─────────────────────────────────────────
router.get("/profile/public/:userId", authMiddleware, getPublicProfileController);

// ─────────────────────────────────────────
// NEW (Phase 1a — Learning module CR flow): Faculty/Admin-only,
// separate from the self-service PATCH /profile route above. This is
// the ONLY legitimate way isCR ever becomes true — see
// profile.validator.js's file header for why it's deliberately absent
// from updateProfileSchema. Static param route, no ambiguity risk with
// "/profile" siblings above since the path prefix differs.
// jobActionLimiter reused here (same "moderate write action by staff"
// rate-limit tier already applied to Subject creation in
// learning.routes.js) — this isn't a high-frequency action.
// ─────────────────────────────────────────
router.patch(
  "/:userId/cr-status",
  authMiddleware,
  allowRoles("faculty", "admin"),
  jobActionLimiter,
  validateSetCRStatusParam,
  validateSetCRStatus,
  setCRStatusController
);

// ─────────────────────────────────────────
// Avatar — memory storage (small image, no parser needs a disk path
// the way resume parsing does). Static route registered before any
// future dynamic "/profile/:id"-style route to avoid ambiguity.
// ─────────────────────────────────────────
const avatarUpload = createUploadMiddleware(MEDIA_TYPES.AVATAR, { storage: "memory", fieldName: "avatar" });

router.post("/profile/avatar", authMiddleware, uploadLimiter, avatarUpload, uploadAvatarController);
router.delete("/profile/avatar", authMiddleware, deleteAvatarController);

// ─────────────────────────────────────────
// Skills — "/skills/bulk" is a static path and MUST be registered
// before "/skills/:skillId", otherwise Express would match the literal
// string "bulk" as a :skillId param and route bulk-add requests into
// getSkillByIdController/updateSkillController instead. Same
// static-before-dynamic rule already used for "/requests/sent" in
// connection.routes.js.
// ─────────────────────────────────────────
router.post("/skills", authMiddleware, validateCreateSkill, addSkillController);
router.post("/skills/bulk", authMiddleware, validateBulkAddSkills, bulkAddSkillsController);
router.get("/skills", authMiddleware, getUserSkillsController);
router.get("/skills/:skillId", authMiddleware, getSkillByIdController);
router.patch("/skills/:skillId", authMiddleware, validateUpdateSkill, updateSkillController);
router.delete("/skills/:skillId", authMiddleware, deleteSkillController);

router.post("/educations", authMiddleware, validateCreateEducation, addEducationController);
router.get("/educations", authMiddleware, getUserEducationsController);
router.get("/educations/:educationId", authMiddleware, getEducationByIdController);
router.patch("/educations/:educationId", authMiddleware, validateUpdateEducation, updateEducationController);
router.delete("/educations/:educationId", authMiddleware, deleteEducationController);

router.post("/experiences", authMiddleware, validateCreateExperience, addExperienceController);
router.get("/experiences", authMiddleware, getUserExperiencesController);
router.get("/experiences/:experienceId", authMiddleware, getExperienceByIdController);
router.patch("/experiences/:experienceId", authMiddleware, validateUpdateExperience, updateExperienceController);
router.delete("/experiences/:experienceId", authMiddleware, deleteExperienceController);

router.post("/projects", authMiddleware, validateCreateProject, addProjectController);
router.get("/projects", authMiddleware, getUserProjectsController);
router.get("/projects/public/:userId", getPublicProjectsController);
router.get("/projects/:projectId", authMiddleware, getProjectByIdController);
router.patch("/projects/:projectId", authMiddleware, validateUpdateProject, updateProjectController);
router.delete("/projects/:projectId", authMiddleware, deleteProjectController);

// ─────────────────────────────────────────
// Resumes — multipart/form-data, field name "resume", disk storage
// (parser needs a real file path to read from before Cloudinary upload)
// ─────────────────────────────────────────
const resumeUpload = createUploadMiddleware(MEDIA_TYPES.RESUME, { storage: "disk", fieldName: "resume" });

router.post("/resumes", authMiddleware, uploadLimiter, resumeUpload, uploadResumeController);
router.put("/resumes/:resumeId", authMiddleware, uploadLimiter, resumeUpload, replaceResumeController);
router.get("/resumes", authMiddleware, getUserResumesController);
router.get("/resumes/default", authMiddleware, getDefaultResumeController);
router.patch("/resumes/:resumeId", authMiddleware, validateUpdateResume, updateResumeController);
router.delete("/resumes/:resumeId", authMiddleware, deleteResumeController);

module.exports = router;