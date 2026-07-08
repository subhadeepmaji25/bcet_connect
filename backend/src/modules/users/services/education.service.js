// backend/src/modules/users/services/education.service.js
const Education = require("../models/Education");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const ApiError = require("../../../shared/errors/ApiError");

const ALLOWED_EDUCATION_FIELDS = ["institution","degree","branch","specialization","educationLevel","startYear","endYear","current","gradeType","cgpa","achievements","skillsExtracted","tags","location"];

const addEducation = async (userId, payload) => {
  const { institution, degree, branch, specialization, educationLevel, startYear, endYear, current, gradeType, cgpa, achievements, skillsExtracted, tags, location } = payload;
  if (!institution || !degree || !branch || !startYear) {
    throw ApiError.badRequest("Institution, degree, branch and startYear are required");
  }
  if (cgpa !== undefined && (cgpa < 0 || cgpa > 10)) {
    throw ApiError.badRequest("CGPA must be between 0 and 10");
  }
  if (!current && endYear && endYear < startYear) {
    throw ApiError.badRequest("End year cannot be before start year");
  }
  const currentYear = new Date().getFullYear();
  if (startYear > currentYear + 1) {
    throw ApiError.badRequest("Start year cannot be in the far future");
  }
  const normalizedInstitution = institution.trim();
  const normalizedDegree = degree.trim();
  const normalizedBranch = branch.trim();
  const duplicate = await Education.findOne({ userId, institution: normalizedInstitution, degree: normalizedDegree, startYear });
  if (duplicate) {
    throw ApiError.conflict("This education record already exists");
  }
  const education = await Education.create({ userId, institution: normalizedInstitution, degree: normalizedDegree, branch: normalizedBranch, specialization, educationLevel, startYear, endYear, current, gradeType, cgpa, achievements, skillsExtracted, tags, location });
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Education added successfully", data: { education, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const updateEducation = async (educationId, userId, payload) => {
  const education = await Education.findOne({ _id: educationId, userId });
  if (!education) {
    throw ApiError.notFound("Education not found or access denied");
  }
  if (payload.cgpa !== undefined && (payload.cgpa < 0 || payload.cgpa > 10)) {
    throw ApiError.badRequest("CGPA must be between 0 and 10");
  }
  const startYear = payload.startYear || education.startYear;
  const endYear = payload.endYear || education.endYear;
  const current = payload.current !== undefined ? payload.current : education.current;
  if (!current && endYear && endYear < startYear) {
    throw ApiError.badRequest("End year cannot be before start year");
  }
  if (payload.institution) payload.institution = payload.institution.trim();
  if (payload.degree) payload.degree = payload.degree.trim();
  if (payload.branch) payload.branch = payload.branch.trim();
  const institutionChanged = payload.institution && payload.institution !== education.institution;
  const degreeChanged = payload.degree && payload.degree !== education.degree;
  const startYearChanged = payload.startYear && payload.startYear !== education.startYear;
  if (institutionChanged || degreeChanged || startYearChanged) {
    const duplicate = await Education.findOne({ userId, institution: payload.institution || education.institution, degree: payload.degree || education.degree, startYear: payload.startYear || education.startYear, _id: { $ne: educationId } });
    if (duplicate) {
      throw ApiError.conflict("An education record with these details already exists");
    }
  }
  ALLOWED_EDUCATION_FIELDS.forEach(field => {
    if (payload[field] !== undefined) {
      education[field] = payload[field];
    }
  });
  await education.save();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Education updated successfully", data: { education, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const deleteEducation = async (educationId, userId) => {
  const education = await Education.findOne({ _id: educationId, userId });
  if (!education) {
    throw ApiError.notFound("Education not found or access denied");
  }
  await education.deleteOne();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Education deleted successfully", data: { completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const getUserEducations = async (userId) => {
  return Education.find({ userId }).sort({ current: -1, endYear: -1, startYear: -1 });
};

const getEducationById = async (educationId, userId) => {
  const education = await Education.findOne({ _id: educationId, userId });
  if (!education) {
    throw ApiError.notFound("Education not found or access denied");
  }
  return education;
};

module.exports = { addEducation, updateEducation, deleteEducation, getUserEducations, getEducationById };
