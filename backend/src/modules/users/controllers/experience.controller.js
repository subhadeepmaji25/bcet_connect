// backend/src/modules/users/controllers/experience.controller.js

const {
  addExperience,
  updateExperience,
  deleteExperience,
  getUserExperiences,
  getExperienceById,
} = require("../services/experience.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const addExperienceController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await addExperience(userId, req.body);
    logger.info("Experience added", { module: "Users", userId });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Add experience failed", error, { module: "Users" });
    next(error);
  }
};

const updateExperienceController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;
    const result = await updateExperience(experienceId, userId, req.body);
    logger.info("Experience updated", { module: "Users", userId, experienceId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Update experience failed", error, { module: "Users" });
    next(error);
  }
};

const deleteExperienceController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;
    const result = await deleteExperience(experienceId, userId);
    logger.info("Experience deleted", { module: "Users", userId, experienceId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Delete experience failed", error, { module: "Users" });
    next(error);
  }
};

const getUserExperiencesController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const experiences = await getUserExperiences(userId);
    return sendResponse(res, {
      success: true,
      message: "Experience records fetched successfully",
      data: { experiences },
    });
  } catch (error) {
    logger.error("Get user experiences failed", error, { module: "Users" });
    next(error);
  }
};

// FIX: userId pass karo — service ka signature (experienceId, userId) hai
const getExperienceByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;                                  // ← FIX
    const { experienceId } = req.params;
    const experience = await getExperienceById(experienceId, userId); // ← FIX
    return sendResponse(res, {
      success: true,
      message: "Experience record fetched successfully",
      data: { experience },
    });
  } catch (error) {
    logger.error("Get experience by id failed", error, { module: "Users" });
    next(error);
  }
};

module.exports = {
  addExperienceController,
  updateExperienceController,
  deleteExperienceController,
  getUserExperiencesController,
  getExperienceByIdController,
};