// backend/src/modules/learning/services/subject.service.js
const Subject = require("../models/Subject");
const ApiError = require("../../../shared/errors/ApiError");
const { SUBJECT_MANAGER_ROLES } = require("../constants/subject.constants");

const ALLOWED_UPDATE_FIELDS = ["name", "credits", "description"];

const createSubject = async (userId, userRole, payload) => {
  if (!SUBJECT_MANAGER_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty or admin can create subjects");
  }

  let subject;
  try {
    subject = await Subject.create({
      ...payload,
      facultyId: userId
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw ApiError.conflict(`Subject code "${payload.code}" already exists for this department`);
    }
    throw err;
  }

  return { success: true, message: "Subject created successfully", data: { subject } };
};

const updateSubject = async (subjectId, userId, userRole, payload) => {
  const subject = await Subject.findOne({ _id: subjectId, isArchived: false });
  if (!subject) throw ApiError.notFound("Subject not found");

  const isOwner = subject.facultyId.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You can only edit subjects you own");
  }

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) subject[field] = payload[field];
  });
  await subject.save();

  return { success: true, message: "Subject updated successfully", data: { subject } };
};

const archiveSubject = async (subjectId, userId, userRole) => {
  const subject = await Subject.findOne({ _id: subjectId, isArchived: false });
  if (!subject) throw ApiError.notFound("Subject not found");

  const isOwner = subject.facultyId.toString() === userId.toString();
  if (!isOwner && userRole !== "admin") {
    throw ApiError.forbidden("You cannot archive this subject");
  }

  subject.isArchived = true;
  await subject.save();

  return { success: true, message: "Subject archived successfully", data: null };
};

const listSubjects = async ({ department, semester, page = 1, limit = 20 } = {}) => {
  const query = { isArchived: false };
  if (department) query.department = department;
  if (semester) query.semester = Number(semester);

  const skip = (Number(page) - 1) * Number(limit);
  const [subjects, total] = await Promise.all([
    Subject.find(query)
      .sort({ semester: 1, name: 1 })
      .skip(skip).limit(Number(limit)).lean(),
    Subject.countDocuments(query)
  ]);

  return {
    subjects,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

const getSubjectById = async (subjectId) => {
  const subject = await Subject.findOne({ _id: subjectId, isArchived: false })
    .populate("facultyId", "username fullName role")
    .lean();
  if (!subject) throw ApiError.notFound("Subject not found");
  return subject;
};

const getMySubjects = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const [subjects, total] = await Promise.all([
    Subject.find({ facultyId: userId, isArchived: false })
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Subject.countDocuments({ facultyId: userId, isArchived: false })
  ]);
  return { subjects, pagination: { total, page: Number(page), limit: Number(limit) } };
};

const assertSubjectOwnership = async (subjectId, userId) => {
  const subject = await Subject.findOne({ _id: subjectId, isArchived: false }).lean();
  if (!subject) throw ApiError.notFound("Subject not found");
  if (subject.facultyId.toString() !== userId.toString()) {
    throw ApiError.forbidden("You do not own this subject");
  }
  return subject;
};

module.exports = {
  createSubject,
  updateSubject,
  archiveSubject,
  listSubjects,
  getSubjectById,
  getMySubjects,
  assertSubjectOwnership
};