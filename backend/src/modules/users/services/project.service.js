// backend/src/modules/users/services/project.service.js
const Project = require("../models/Project");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const { normalizeSkillList } = require("../../recommendation/utils/normalization");
const ApiError = require("../../../shared/errors/ApiError");

// NOTE: "skillsExtracted" isse hata diya gaya hai — ye ab client se directly
// accept nahi hota. Ye hamesha techStack se derive hota hai (buildProjectSkills).
const ALLOWED_PROJECT_FIELDS = ["title","description","projectType","status","visibility","techStack","collaborators","achievements","githubUrl","demoUrl","thumbnail","thumbnailPublicId","gallery","startDate","endDate","teamSize","featured","deployed"];

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// techStack (aur agar purana skillsExtracted bheja gaya ho to usse bhi) se
// ek normalized, deduplicated skills list banata hai. Ye hi ab canonical
// source hai — client isse override nahi kar sakta.
const buildProjectSkills = (techStack, legacySkillsExtracted) => {
  const fromTechStack = normalizeSkillList(techStack);
  const fromLegacy = normalizeSkillList(legacySkillsExtracted);
  return [...new Set([...fromTechStack, ...fromLegacy])];
};

const addProject = async (userId, payload) => {
  const { title, description, projectType, status, visibility, techStack, skillsExtracted, collaborators, achievements, githubUrl, demoUrl, thumbnail, thumbnailPublicId, gallery, startDate, endDate, teamSize, featured, deployed } = payload;
  if (!title || !description) {
    throw ApiError.badRequest("Title and description are required");
  }
  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();
  const normalizedTechStack = Array.isArray(techStack) ? techStack.map(t => t.trim().toLowerCase()) : techStack;
  if (teamSize !== undefined && teamSize < 1) {
    throw ApiError.badRequest("Team size must be at least 1");
  }
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest("End date cannot be before start date");
  }
  if (githubUrl && !isValidUrl(githubUrl)) {
    throw ApiError.badRequest("Invalid GitHub URL");
  }
  if (demoUrl && !isValidUrl(demoUrl)) {
    throw ApiError.badRequest("Invalid demo URL");
  }
  const duplicate = await Project.findOne({ userId, title: normalizedTitle });
  if (duplicate) {
    throw ApiError.conflict("A project with this title already exists");
  }

  // skillsExtracted ab yahan se derive hota hai — client jo bheje wo sirf
  // "legacy" input ki tarah treat hota hai, final source of truth techStack hai.
  const mergedSkills = buildProjectSkills(normalizedTechStack, skillsExtracted);

  const project = await Project.create({ userId, title: normalizedTitle, description: normalizedDescription, projectType, status, visibility, techStack: normalizedTechStack, skillsExtracted: mergedSkills, collaborators, achievements, githubUrl, demoUrl, thumbnail, thumbnailPublicId, gallery, startDate, endDate, teamSize, featured: !!featured, deployed: !!deployed });
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Project added successfully", data: { project, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const updateProject = async (projectId, userId, payload) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw ApiError.notFound("Project not found or access denied");
  }
  if (payload.teamSize !== undefined && payload.teamSize < 1) {
    throw ApiError.badRequest("Team size must be at least 1");
  }
  const startDate = payload.startDate || project.startDate;
  const endDate = payload.endDate || project.endDate;
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest("End date cannot be before start date");
  }
  if (payload.githubUrl && !isValidUrl(payload.githubUrl)) {
    throw ApiError.badRequest("Invalid GitHub URL");
  }
  if (payload.demoUrl && !isValidUrl(payload.demoUrl)) {
    throw ApiError.badRequest("Invalid demo URL");
  }
  if (payload.title) payload.title = payload.title.trim();
  if (payload.description) payload.description = payload.description.trim();
  if (payload.techStack && Array.isArray(payload.techStack)) {
    payload.techStack = payload.techStack.map(t => t.trim().toLowerCase());
  }
  if (payload.title && payload.title !== project.title) {
    const duplicate = await Project.findOne({ userId, title: payload.title, _id: { $ne: projectId } });
    if (duplicate) {
      throw ApiError.conflict("A project with this title already exists");
    }
  }

  ALLOWED_PROJECT_FIELDS.forEach(field => {
    if (payload[field] !== undefined) {
      project[field] = payload[field];
    }
  });

  // techStack update hua ho ya na hua ho, skillsExtracted ko hamesha
  // current techStack se dobara derive karo — kabhi stale nahi rahega.
  // payload.skillsExtracted (agar bheja gaya ho) sirf legacy input ki tarah lo.
  project.skillsExtracted = buildProjectSkills(project.techStack, payload.skillsExtracted);

  await project.save();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Project updated successfully", data: { project, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const deleteProject = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw ApiError.notFound("Project not found or access denied");
  }
  await project.deleteOne();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Project deleted successfully", data: { completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const getUserProjects = async (userId) => {
  return Project.find({ userId }).sort({ featured: -1, deployed: -1, createdAt: -1 });
};

const getPublicProjects = async (userId) => {
  return Project.find({ userId, visibility: "public", isDeleted: false }).sort({ featured: -1, deployed: -1, createdAt: -1 });
};

const getProjectById = async (projectId, userId) => {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) {
    throw ApiError.notFound("Project not found or access denied");
  }
  return project;
};

module.exports = { addProject, updateProject, deleteProject, getUserProjects, getPublicProjects, getProjectById };
