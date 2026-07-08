// backend/src/modules/users/controllers/project.controller.js

const {
  addProject,
  updateProject,
  deleteProject,
  getUserProjects,
  getPublicProjects,
  getProjectById,
} = require("../services/project.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const addProjectController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await addProject(userId, req.body);
    logger.info("Project added", { module: "Users", userId, title: req.body.title });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Add project failed", error, { module: "Users" });
    next(error);
  }
};

const updateProjectController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const result = await updateProject(projectId, userId, req.body);
    logger.info("Project updated", { module: "Users", userId, projectId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Update project failed", error, { module: "Users" });
    next(error);
  }
};

const deleteProjectController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.params;
    const result = await deleteProject(projectId, userId);
    logger.info("Project deleted", { module: "Users", userId, projectId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Delete project failed", error, { module: "Users" });
    next(error);
  }
};

const getUserProjectsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const projects = await getUserProjects(userId);
    return sendResponse(res, {
      success: true,
      message: "Projects fetched successfully",
      data: { projects },
    });
  } catch (error) {
    logger.error("Get user projects failed", error, { module: "Users" });
    next(error);
  }
};

const getPublicProjectsController = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const projects = await getPublicProjects(userId);
    return sendResponse(res, {
      success: true,
      message: "Public projects fetched successfully",
      data: { projects },
    });
  } catch (error) {
    logger.error("Get public projects failed", error, { module: "Users" });
    next(error);
  }
};

// FIX: userId pass karo — service ka signature (projectId, userId) hai
const getProjectByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;                            // ← FIX
    const { projectId } = req.params;
    const project = await getProjectById(projectId, userId); // ← FIX
    return sendResponse(res, {
      success: true,
      message: "Project fetched successfully",
      data: { project },
    });
  } catch (error) {
    logger.error("Get project by id failed", error, { module: "Users" });
    next(error);
  }
};

module.exports = {
  addProjectController,
  updateProjectController,
  deleteProjectController,
  getUserProjectsController,
  getPublicProjectsController,
  getProjectByIdController,
};