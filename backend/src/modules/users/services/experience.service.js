// backend/src/modules/users/services/experience.service.js
const Experience = require("../models/Experience");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const ApiError = require("../../../shared/errors/ApiError");

const ALLOWED_EXPERIENCE_FIELDS = ["company","companyDomain","position","employmentType","industry","description","achievements","skillsUsed","location","startDate","endDate","currentlyWorking","proofs"];

const addExperience = async (userId, payload) => {
  const { company, companyDomain, position, employmentType, industry, description, achievements, skillsUsed, location, startDate, endDate, currentlyWorking, proofs } = payload;
  if (!company || !position || !startDate) {
    throw ApiError.badRequest("Company, position and startDate are required");
  }
  if (currentlyWorking && endDate) {
    throw ApiError.badRequest("Cannot set endDate when currentlyWorking is true");
  }
  if (!currentlyWorking && endDate && new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest("End date cannot be before start date");
  }
  const normalizedCompany = company.trim();
  const normalizedPosition = position.trim();
  const normalizedIndustry = industry ? industry.trim() : industry;
  const duplicate = await Experience.findOne({ userId, company: normalizedCompany, position: normalizedPosition, startDate });
  if (duplicate) {
    throw ApiError.conflict("This experience record already exists");
  }
  const experience = await Experience.create({ userId, company: normalizedCompany, companyDomain, position: normalizedPosition, employmentType, industry: normalizedIndustry, description, achievements, skillsUsed, location, startDate, endDate: currentlyWorking ? null : endDate, currentlyWorking: !!currentlyWorking, proofs });
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Experience added successfully", data: { experience, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const updateExperience = async (experienceId, userId, payload) => {
  const experience = await Experience.findOne({ _id: experienceId, userId });
  if (!experience) {
    throw ApiError.notFound("Experience not found or access denied");
  }
  const willBeCurrentlyWorking = payload.currentlyWorking !== undefined ? payload.currentlyWorking : experience.currentlyWorking;
  const willHaveEndDate = payload.endDate !== undefined ? payload.endDate : experience.endDate;
  if (willBeCurrentlyWorking && willHaveEndDate) {
    throw ApiError.badRequest("Cannot set endDate when currentlyWorking is true");
  }
  const startDate = payload.startDate || experience.startDate;
  if (!willBeCurrentlyWorking && willHaveEndDate && new Date(willHaveEndDate) < new Date(startDate)) {
    throw ApiError.badRequest("End date cannot be before start date");
  }
  if (payload.company) payload.company = payload.company.trim();
  if (payload.position) payload.position = payload.position.trim();
  if (payload.industry) payload.industry = payload.industry.trim();
  const companyChanged = payload.company && payload.company !== experience.company;
  const positionChanged = payload.position && payload.position !== experience.position;
  const startDateChanged = payload.startDate && String(payload.startDate) !== String(experience.startDate);
  if (companyChanged || positionChanged || startDateChanged) {
    const duplicate = await Experience.findOne({ userId, company: payload.company || experience.company, position: payload.position || experience.position, startDate: payload.startDate || experience.startDate, _id: { $ne: experienceId } });
    if (duplicate) {
      throw ApiError.conflict("An experience record with these details already exists");
    }
  }
  ALLOWED_EXPERIENCE_FIELDS.forEach(field => {
    if (payload[field] !== undefined) {
      experience[field] = payload[field];
    }
  });
  if (experience.currentlyWorking) {
    experience.endDate = null;
  }
  await experience.save();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Experience updated successfully", data: { experience, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const deleteExperience = async (experienceId, userId) => {
  const experience = await Experience.findOne({ _id: experienceId, userId });
  if (!experience) {
    throw ApiError.notFound("Experience not found or access denied");
  }
  await experience.deleteOne();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Experience deleted successfully", data: { completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const getUserExperiences = async (userId) => {
  return Experience.find({ userId }).sort({ currentlyWorking: -1, startDate: -1 });
};

const getExperienceById = async (experienceId, userId) => {
  const experience = await Experience.findOne({ _id: experienceId, userId });
  if (!experience) {
    throw ApiError.notFound("Experience not found or access denied");
  }
  return experience;
};

module.exports = { addExperience, updateExperience, deleteExperience, getUserExperiences, getExperienceById };
