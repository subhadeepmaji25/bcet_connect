// backend/src/modules/users/controllers/education.controller.js

const {
  addEducation,
  updateEducation,
  deleteEducation,
  getUserEducations,
  getEducationById,
} = require("../services/education.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const addEducationController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await addEducation(userId, req.body);
    logger.info("Education added", { module: "Users", userId });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Add education failed", error, { module: "Users" });
    next(error);
  }
};

const updateEducationController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { educationId } = req.params;
    const result = await updateEducation(educationId, userId, req.body);
    logger.info("Education updated", { module: "Users", userId, educationId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Update education failed", error, { module: "Users" });
    next(error);
  }
};

const deleteEducationController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { educationId } = req.params;
    const result = await deleteEducation(educationId, userId);
    logger.info("Education deleted", { module: "Users", userId, educationId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Delete education failed", error, { module: "Users" });
    next(error);
  }
};

const getUserEducationsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const educations = await getUserEducations(userId);
    return sendResponse(res, {
      success: true,
      message: "Education records fetched successfully",
      data: { educations },
    });
  } catch (error) {
    logger.error("Get user educations failed", error, { module: "Users" });
    next(error);
  }
};

// FIX: userId pass karo — service ka signature (educationId, userId) hai
const getEducationByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;                              // ← FIX
    const { educationId } = req.params;
    const education = await getEducationById(educationId, userId); // ← FIX
    return sendResponse(res, {
      success: true,
      message: "Education record fetched successfully",
      data: { education },
    });
  } catch (error) {
    logger.error("Get education by id failed", error, { module: "Users" });
    next(error);
  }
};

module.exports = {
  addEducationController,
  updateEducationController,
  deleteEducationController,
  getUserEducationsController,
  getEducationByIdController,
};