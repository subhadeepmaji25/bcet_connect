// backend/src/engines/profile-completion/calculateCompletion.js
const Profile = require("../../modules/users/models/Profile");
const Skill = require("../../modules/users/models/Skill");
const Education = require("../../modules/users/models/Education");
const Project = require("../../modules/users/models/Project");
const Resume = require("../../modules/users/models/Resume");

const WEIGHTS = {
  profile: 20,
  skills: 20,
  education: 20,
  projects: 20,
  resume: 20
};
const RESUME_UPLOAD_ONLY_CREDIT_RATIO = 0.3;

const calculateProfileScore = (profile) => {
  if (!profile) return 0;

  let fields = 0;
  const totalFields = 8;

  if (profile.fullName) fields++;
  if (profile.headline) fields++;
  if (profile.bio) fields++;
  if (profile.avatar) fields++;
  if (profile.location) fields++;

  if (profile.branch || profile.department) {
    fields++;
  }

  if (profile.interests && profile.interests.length > 0) {
    fields++;
  }

  if (
    profile.socialLinks &&
    (profile.socialLinks.github || profile.socialLinks.linkedin || profile.socialLinks.portfolio)
  ) {
    fields++;
  }

  return Math.round((fields / totalFields) * WEIGHTS.profile);
};

const calculateSkillScore = (skills) => {
  if (!skills || skills.length === 0) {
    return 0;
  }

  if (skills.length >= 10) {
    return WEIGHTS.skills;
  }

  return Math.round((skills.length / 10) * WEIGHTS.skills);
};

const calculateEducationScore = (education) => {
  if (!education || education.length === 0) {
    return 0;
  }

  return WEIGHTS.education;
};

const calculateProjectScore = (projects) => {
  if (!projects || projects.length === 0) {
    return 0;
  }

  if (projects.length >= 5) {
    return WEIGHTS.projects;
  }

  return Math.round((projects.length / 5) * WEIGHTS.projects);
};

const calculateResumeScore = (resumes) => {
  if (!resumes || resumes.length === 0) {
    return 0;
  }

  const hasUsefullyParsedResume = resumes.some(
    (resume) =>
      resume.parseStatus === "completed" &&
      Array.isArray(resume.extractedSkills) &&
      resume.extractedSkills.length > 0
  );

  if (hasUsefullyParsedResume) {
    return WEIGHTS.resume;
  }

  return Math.round(WEIGHTS.resume * RESUME_UPLOAD_ONLY_CREDIT_RATIO);
};

const calculateCompletion = async (userId) => {
  const [profile, skills, education, projects, resumes] = await Promise.all([
    Profile.findOne({ userId }),
    Skill.find({ userId }),
    Education.find({ userId }),
    Project.find({ userId, visibility: "public", isDeleted: false }),
    Resume.find({ userId, isDeleted: false })
  ]);

  const profileScore = calculateProfileScore(profile);
  const skillScore = calculateSkillScore(skills);
  const educationScore = calculateEducationScore(education);
  const projectScore = calculateProjectScore(projects);
  const resumeScore = calculateResumeScore(resumes);

  const totalCompletion = profileScore + skillScore + educationScore + projectScore + resumeScore;
  const recommendationEnabled = totalCompletion >= 60;
  const previousCompletion = profile ? (profile.profileCompletion || 0) : null;
  if (profile) {
    profile.profileCompletion = totalCompletion;
    profile.recommendationEnabled = recommendationEnabled;
    await profile.save();
  }
  const justCompleted =
    Boolean(profile) && previousCompletion < 100 && totalCompletion === 100;

  return {
    profileScore,
    skillScore,
    educationScore,
    projectScore,
    resumeScore,
    totalCompletion,
    recommendationEnabled,
    justCompleted
  };
};

module.exports = {
  calculateCompletion
};