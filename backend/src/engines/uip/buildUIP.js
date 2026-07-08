// backend/src/engines/uip/buildUIP.js
//
// UIP = User Intelligence Profile — an internal, richer snapshot of a user
// used by the recommendation engine (matchScore.service.js etc). Not
// exposed directly to the public search index; buildSearchProfile.js
// builds that separately from largely the same source data.

const Profile = require("../../modules/users/models/Profile");
const Skill = require("../../modules/users/models/Skill");
const Education = require("../../modules/users/models/Education");
const Experience = require("../../modules/users/models/Experience");
const Project = require("../../modules/users/models/Project");
const Resume = require("../../modules/users/models/Resume");

const buildUIP = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to build a user intelligence profile");
  }

  const [profile, skills, education, experience, projects, resume] = await Promise.all([
    Profile.findOne({ userId }),
    Skill.find({ userId }),
    Education.find({ userId }),
    Experience.find({ userId }),
    // BUG FIX: was `Project.find({ userId, visibility: "public" })` —
    // missing `isDeleted: false`. Project has a soft-delete flag
    // (isDeleted/deletedAt) that this query never checked, so a project
    // the user "deleted" could still show up in their intelligence
    // profile and feed into recommendation matching.
    Project.find({ userId, visibility: "public", isDeleted: false }),
    // BUG FIX: same gap — Resume also has isDeleted/deletedAt, and a
    // deleted-but-still-`isDefault:true` resume record would otherwise
    // keep contributing its extractedSkills here forever.
    Resume.findOne({ userId, isDefault: true, isDeleted: false })
  ]);

  const skillNames = skills.map((skill) => skill.skillName);

  const educationSummary = education.map((item) => ({
    degree: item.degree,
    branch: item.branch,
    institution: item.institution,
    educationLevel: item.educationLevel
  }));

  const experienceSummary = experience.map((item) => ({
    company: item.company,
    position: item.position,
    skillsUsed: item.skillsUsed,
    employmentType: item.employmentType,
    // `durationInMonths` is a virtual on the Experience schema — accessible
    // here because this query does NOT use `.lean()`, which would strip
    // virtuals off the returned documents.
    durationInMonths: item.durationInMonths
  }));

  const projectSummary = projects.map((project) => ({
    title: project.title,
    techStack: project.techStack,
    skillsExtracted: project.skillsExtracted,
    deployed: project.deployed,
    projectScore: project.projectScore
  }));

  const resumeSkills = resume ? resume.extractedSkills : [];

  const profileCompletion = profile ? profile.profileCompletion : 0;
  const recommendationReady = profileCompletion >= 60;

  const metrics = {
    totalSkills: skillNames.length,
    totalEducation: education.length,
    totalExperience: experience.length,
    totalProjects: projects.length,
    resumeUploaded: !!resume
  };

  const uip = {
    userId,
    role: profile?.role || null,
    profileCompletion,
    recommendationReady,
    skills: skillNames,
    education: educationSummary,
    experience: experienceSummary,
    projects: projectSummary,
    resumeSkills,
    metrics,
    generatedAt: new Date()
  };

  return uip;
};

module.exports = {
  buildUIP
};