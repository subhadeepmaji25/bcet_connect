// backend/src/modules/users/controllers/skill.controller.js

const {
  addSkill,
  addSkillsBulk,
  updateSkill,
  deleteSkill,
  getUserSkills,
  getSkillById,
} = require("../services/skill.service");

const sendResponse = require("../../../shared/response/sendResponse");
const logger = require("../../../shared/logger/logger");

const addSkillController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await addSkill(userId, req.body);
    logger.info("Skill added", { module: "Users", userId, skill: req.body.skillName });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Add skill failed", error, { module: "Users" });
    next(error);
  }
};

// Bulk-add — the confirm step after a resume upload's extractedSkills
// were shown to the user as suggestions. req.body.skillNames is an
// array of plain strings the user selected; req.body.source lets the
// caller override the default "resume" tag if this same endpoint is
// ever reused for a different bulk-suggestion source later (e.g.
// project-extracted skills), without needing a new route.
const bulkAddSkillsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillNames, source } = req.body;
    const result = await addSkillsBulk(userId, skillNames, { source });
    logger.info("Skills bulk-added", {
      module: "Users",
      userId,
      requested: skillNames.length,
      added: result.data.added.length,
      skipped: result.data.skippedExisting.length,
    });
    return sendResponse(res, {
      statusCode: 201,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Bulk add skills failed", error, { module: "Users" });
    next(error);
  }
};

const updateSkillController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;
    const result = await updateSkill(skillId, userId, req.body);
    logger.info("Skill updated", { module: "Users", userId, skillId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Update skill failed", error, { module: "Users" });
    next(error);
  }
};

const deleteSkillController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { skillId } = req.params;
    const result = await deleteSkill(skillId, userId);
    logger.info("Skill deleted", { module: "Users", userId, skillId });
    return sendResponse(res, {
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    logger.error("Delete skill failed", error, { module: "Users" });
    next(error);
  }
};

const getUserSkillsController = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const skills = await getUserSkills(userId);
    return sendResponse(res, {
      success: true,
      message: "Skills fetched successfully",
      data: { skills },
    });
  } catch (error) {
    logger.error("Get user skills failed", error, { module: "Users" });
    next(error);
  }
};

// FIX: userId pass karo — ownership enforce karne ke liye
const getSkillByIdController = async (req, res, next) => {
  try {
    const userId = req.user.id;                    // ← FIX
    const { skillId } = req.params;
    const skill = await getSkillById(skillId, userId); // ← FIX
    return sendResponse(res, {
      success: true,
      message: "Skill fetched successfully",
      data: { skill },
    });
  } catch (error) {
    logger.error("Get skill by id failed", error, { module: "Users" });
    next(error);
  }
};

module.exports = {
  addSkillController,
  bulkAddSkillsController,
  updateSkillController,
  deleteSkillController,
  getUserSkillsController,
  getSkillByIdController,
};