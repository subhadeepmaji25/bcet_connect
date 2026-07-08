// backend/src/modules/users/controllers/resume.controller.js
//
// Controller ab file ko req.file (multer diskStorage) se leta hai, JSON
// body se nahi. resumeUrl/publicId client kabhi nahi bhejta — wo hamesha
// server-side Cloudinary upload se generate hota hai (single source of truth).

const {
  uploadResume,
  replaceResume,
  updateResume,
  deleteResume,
  getUserResumes,
  getDefaultResume
} = require("../services/resume.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const uploadResumeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await uploadResume(userId, req.file);
    logger.info("Resume uploaded", { module: "Users", userId, fileName: req.file?.originalname });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error("Resume upload failed", { module: "Users", error: error.message });
    next(error);
  }
};

const replaceResumeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resumeId } = req.params;
    const result = await replaceResume(resumeId, userId, req.file);
    logger.info("Resume replaced", { module: "Users", userId, resumeId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error("Resume replace failed", { module: "Users", error: error.message });
    next(error);
  }
};

const updateResumeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resumeId } = req.params;
    const result = await updateResume(resumeId, userId, req.body);
    logger.info("Resume updated", { module: "Users", userId, resumeId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error("Update resume failed", { module: "Users", error: error.message });
    next(error);
  }
};

const deleteResumeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { resumeId } = req.params;
    const result = await deleteResume(resumeId, userId);
    logger.info("Resume deleted", { module: "Users", userId, resumeId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    logger.error("Delete resume failed", { module: "Users", error: error.message });
    next(error);
  }
};

const getUserResumesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const resumes = await getUserResumes(userId);
    return sendResponse(res, {
      success: true,
      message: "Resumes fetched successfully",
      data: { resumes }
    });
  } catch (error) {
    logger.error("Get user resumes failed", { module: "Users", error: error.message });
    next(error);
  }
};

const getDefaultResumeController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const resume = await getDefaultResume(userId);
    return sendResponse(res, {
      success: true,
      message: resume ? "Default resume fetched successfully" : "No default resume found",
      data: { resume }
    });
  } catch (error) {
    logger.error("Get default resume failed", { module: "Users", error: error.message });
    next(error);
  }
};

module.exports = {
  uploadResumeController,
  replaceResumeController,
  updateResumeController,
  deleteResumeController,
  getUserResumesController,
  getDefaultResumeController
};
