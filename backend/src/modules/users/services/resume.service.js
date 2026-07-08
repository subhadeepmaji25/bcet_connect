// backend/src/modules/users/services/resume.service.js
const Resume = require("../models/Resume");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const { addSkillsBulk } = require("./skill.service");
const { parseResumeFile } = require("../../resume-parser/services/parser.service");
const { uploadMedia, deleteMedia, cleanupLocalFile } = require("../../../shared/media/media.service");
const { MEDIA_TYPES } = require("../../../shared/media/media.constants");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../notification/constants/notification.constants");
const ApiError = require("../../../shared/errors/ApiError");
const logger = require("../../../shared/logger/logger");

const ALLOWED_RESUME_UPDATE_FIELDS = ["isDefault"];

const EMPTY_PARSE_RESULT = {
  skills: [],
  highConfidenceSkills: [],
  lowConfidenceSkills: [],
  detailedSkills: []
};

const parseWithFallback = async (filePath, meta) => {
  try {
    const parseResult = await parseResumeFile(filePath, meta);
    return { parseResult, parseStatus: "completed" };
  } catch (err) {
    logger.error("Resume parsing failed, will still save file with empty skills", {
      module: "Resume",
      userId: meta.userId,
      error: err.message
    });
    return { parseResult: EMPTY_PARSE_RESULT, parseStatus: "failed" };
  }
};

const mapParseResultToResumeFields = (parseResult) => ({
  extractedSkills: parseResult.skills || [],
  highConfidenceSkills: parseResult.highConfidenceSkills || [],
  lowConfidenceSkills: parseResult.lowConfidenceSkills || [],
  skillDetails: parseResult.detailedSkills || []
});

const autoSyncExtractedSkills = async (userId, skillNames = []) => {
  const candidateNames = (skillNames || []).filter(
    (name) => typeof name === "string" && name.trim().length > 0
  );

  if (candidateNames.length === 0) {
    const syncResult = await syncUserIntelligence(userId);
    return { syncResult, autoAddedSkills: [], skillsSkippedExisting: [] };
  }

  try {
    const bulkResult = await addSkillsBulk(userId, candidateNames, { source: "resume" });
    return {
      syncResult: {
        totalCompletion: bulkResult.data.completion,
        recommendationEnabled: bulkResult.data.recommendationEnabled
      },
      autoAddedSkills: bulkResult.data.added,
      skillsSkippedExisting: bulkResult.data.skippedExisting
    };
  } catch (err) {
    logger.error("Auto-adding resume-extracted skills failed, resume upload still succeeds", {
      module: "Resume",
      userId,
      error: err.message
    });
    const syncResult = await syncUserIntelligence(userId);
    return { syncResult, autoAddedSkills: [], skillsSkippedExisting: [] };
  }
};

// Small shared helper so uploadResume and replaceResume notify the
// exact same way — one place to change if the event logic ever changes.
const notifyResumeOutcome = async (userId, resumeId, parseStatus) => {
  const event = parseStatus === "completed"
    ? NOTIFICATION_EVENTS.RESUME_UPLOADED
    : NOTIFICATION_EVENTS.RESUME_PARSE_FAILED;

  await notify(event, {
    userId,
    data: {},
    meta: { resumeId }
  });
};

const uploadResume = async (userId, file) => {
  if (!file || !file.path) {
    throw ApiError.validation("Resume file is required");
  }
  const { path: filePath, originalname: originalName, mimetype: mimeType, size: fileSize } = file;
  try {
    const duplicate = await Resume.findOne({ userId, fileName: originalName, fileSize, isDeleted: false });
    if (duplicate) {
      throw ApiError.conflict("This resume has already been uploaded");
    }
    const { parseResult, parseStatus } = await parseWithFallback(filePath, {
      userId,
      originalName,
      mimeType,
      sizeInBytes: fileSize
    });
    const uploaded = await uploadMedia(
      MEDIA_TYPES.RESUME,
      userId,
      { filePath, mimeType, sizeInBytes: fileSize, originalName },
      { use_filename: false }
    );
    const latestResume = await Resume.findOne({ userId }).sort({ resumeVersion: -1 });
    const nextVersion = latestResume ? (latestResume.resumeVersion || 1) + 1 : 1;
    await Resume.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
    const resume = await Resume.create({
      userId,
      resumeUrl: uploaded.url,
      resumePublicId: uploaded.publicId,
      fileName: originalName,
      fileSize,
      mimeType,
      ...mapParseResultToResumeFields(parseResult),
      resumeVersion: nextVersion,
      parseStatus,
      isDefault: true,
      parsedAt: parseStatus === "completed" ? new Date() : null
    });
    const { syncResult, autoAddedSkills, skillsSkippedExisting } = await autoSyncExtractedSkills(
      userId,
      parseResult.skills
    );

    // Notify AFTER everything has actually succeeded and been saved —
    // never before, and never in a way that can affect the response below.
    await notifyResumeOutcome(userId, resume._id, parseStatus);

    return {
      success: true,
      message: parseStatus === "completed" ? "Resume uploaded and parsed successfully" : "Resume uploaded, but parsing failed — skills could not be extracted",
      data: {
        resume,
        extractedSkills: parseResult.skills || [],
        highConfidenceSkills: parseResult.highConfidenceSkills || [],
        lowConfidenceSkills: parseResult.lowConfidenceSkills || [],
        skillDetails: parseResult.detailedSkills || [],
        autoAddedSkills,
        skillsSkippedExisting,
        resumeVersion: nextVersion,
        completion: syncResult.totalCompletion,
        recommendationEnabled: syncResult.recommendationEnabled
      }
    };
  } finally {
    await cleanupLocalFile(filePath, { userId });
  }
};

const replaceResume = async (resumeId, userId, file) => {
  if (!file || !file.path) {
    throw ApiError.validation("Resume file is required");
  }
  const existing = await Resume.findOne({ _id: resumeId, userId, isDeleted: false });
  if (!existing) {
    throw ApiError.notFound("Resume not found or access denied");
  }
  const { path: filePath, originalname: originalName, mimetype: mimeType, size: fileSize } = file;
  try {
    const { parseResult, parseStatus } = await parseWithFallback(filePath, {
      userId,
      originalName,
      mimeType,
      sizeInBytes: fileSize
    });
    const uploaded = await uploadMedia(
      MEDIA_TYPES.RESUME,
      userId,
      { filePath, mimeType, sizeInBytes: fileSize, originalName },
      { use_filename: false }
    );
    if (existing.resumePublicId) {
      await deleteMedia(MEDIA_TYPES.RESUME, existing.resumePublicId);
    }
    existing.resumeUrl = uploaded.url;
    existing.resumePublicId = uploaded.publicId;
    existing.fileName = originalName;
    existing.fileSize = fileSize;
    existing.mimeType = mimeType;
    const mappedFields = mapParseResultToResumeFields(parseResult);
    existing.extractedSkills = mappedFields.extractedSkills;
    existing.highConfidenceSkills = mappedFields.highConfidenceSkills;
    existing.lowConfidenceSkills = mappedFields.lowConfidenceSkills;
    existing.skillDetails = mappedFields.skillDetails;
    existing.parseStatus = parseStatus;
    existing.parsedAt = parseStatus === "completed" ? new Date() : null;
    existing.resumeVersion = (existing.resumeVersion || 1) + 1;
    await existing.save();
    const { syncResult, autoAddedSkills, skillsSkippedExisting } = await autoSyncExtractedSkills(
      userId,
      parseResult.skills
    );

    // Same rule as uploadResume: notify only after the save succeeded.
    await notifyResumeOutcome(userId, existing._id, parseStatus);

    return {
      success: true,
      message: "Resume replaced successfully",
      data: {
        resume: existing,
        autoAddedSkills,
        skillsSkippedExisting,
        completion: syncResult.totalCompletion,
        recommendationEnabled: syncResult.recommendationEnabled
      }
    };
  } finally {
    await cleanupLocalFile(filePath, { userId });
  }
};

const updateResume = async (resumeId, userId, payload) => {
  const resume = await Resume.findOne({ _id: resumeId, userId, isDeleted: false });
  if (!resume) {
    throw ApiError.notFound("Resume not found or access denied");
  }
  if (payload.isDefault === true) {
    await Resume.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
  }
  ALLOWED_RESUME_UPDATE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) {
      resume[field] = payload[field];
    }
  });
  await resume.save();
  const syncResult = await syncUserIntelligence(userId);
  return {
    success: true,
    message: "Resume updated successfully",
    data: { resume, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled }
  };
};

const deleteResume = async (resumeId, userId) => {
  const resume = await Resume.findOne({ _id: resumeId, userId, isDeleted: false });
  if (!resume) {
    throw ApiError.notFound("Resume not found or access denied");
  }
  if (resume.resumePublicId) {
    await deleteMedia(MEDIA_TYPES.RESUME, resume.resumePublicId);
  }
  await resume.deleteOne();
  const syncResult = await syncUserIntelligence(userId);
  return {
    success: true,
    message: "Resume deleted successfully",
    data: { completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled }
  };
};

const getUserResumes = async (userId) => {
  return Resume.find({ userId, isDeleted: false }).sort({ isDefault: -1, resumeVersion: -1, createdAt: -1 });
};

const getDefaultResume = async (userId) => {
  return Resume.findOne({ userId, isDefault: true, isDeleted: false });
};

module.exports = {
  uploadResume,
  replaceResume,
  updateResume,
  deleteResume,
  getUserResumes,
  getDefaultResume
};