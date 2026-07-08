// backend/src/engines/search-profile/buildSearchProfile.js
const User = require("../../modules/auth/models/User");
const Profile = require("../../modules/users/models/Profile");
const Skill = require("../../modules/users/models/Skill");
const Education = require("../../modules/users/models/Education");
const Experience = require("../../modules/users/models/Experience");
const Project = require("../../modules/users/models/Project");
const Resume = require("../../modules/users/models/Resume");
const MentorProfile = require("../../modules/mentorship/models/MentorProfile");
const SearchProfile = require("../../modules/search/models/SearchProfile");
const calculateSearchScore = require("./calculateSearchScore");
const { normalizeSkillList } = require("../../modules/recommendation/utils/normalization");

const normalizeText = (value) => {
  if (value === null || value === undefined || (typeof value !== "string" && typeof value !== "number")) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
};

const normalizeKeyword = (value) => normalizeText(value).toLowerCase();

const normalizeKeywords = (values = []) => {
  if (!Array.isArray(values)) {
    return [];
  }

  const keywords = values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map(normalizeKeyword)
    .filter((value) => value && value.length <= 120);

  return [...new Set(keywords)];
};

const tokenizeText = (value) => {
  const normalized = normalizeKeyword(value);
  if (!normalized) {
    return [];
  }

  return normalized
    .split(/[^a-z0-9+#.]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && token.length <= 40);
};

const normalizeSearchKeywords = (values = []) => {
  const baseKeywords = normalizeKeywords(values);
  return normalizeKeywords([...baseKeywords, ...baseKeywords.flatMap(tokenizeText)]);
};

const dateValue = (value) => {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

const educationYear = (item) => {
  if (item.current) {
    return 9999;
  }

  return Number(item.endYear || item.startYear || 0);
};

const nullableYear = (value) => {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 ? year : null;
};

const pickLatestEducation = (educationList) => {
  if (!educationList || educationList.length === 0) return null;

  const sorted = [...educationList].sort((a, b) => educationYear(b) - educationYear(a));
  const latest = sorted[0];

  return {
    institution: latest.institution || "",
    degree: latest.degree || "",
    branch: latest.branch || "",
    specialization: latest.specialization || "",
    educationLevel: latest.educationLevel || "",
    current: !!latest.current,
    startYear: nullableYear(latest.startYear),
    endYear: nullableYear(latest.endYear),
    skills: normalizeKeywords(latest.skillsExtracted || [])
  };
};

const pickLatestExperience = (experienceList) => {
  if (!experienceList || experienceList.length === 0) return null;

  const sorted = [...experienceList].sort((a, b) => {
    if (a.currentlyWorking !== b.currentlyWorking) {
      return a.currentlyWorking ? -1 : 1;
    }

    const aTime = dateValue(a.endDate) || dateValue(a.startDate);
    const bTime = dateValue(b.endDate) || dateValue(b.startDate);
    return bTime - aTime;
  });

  const latest = sorted[0];

  return {
    company: latest.company || "",
    position: latest.position || "",
    employmentType: latest.employmentType || "",
    industry: latest.industry || "",
    currentlyWorking: !!latest.currentlyWorking,
    skills: normalizeKeywords(latest.skillsUsed || [])
  };
};

const buildSearchProfile = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to build a search profile");
  }

  const [user, profile, skills, education, experience, publicProjects, totalProjectCount, resume, mentorProfile] =
    await Promise.all([
      User.findById(userId),
      Profile.findOne({ userId }),
      Skill.find({ userId }),
      Education.find({ userId }),
      Experience.find({ userId }),
      Project.find({ userId, visibility: "public", isDeleted: false }),
      Project.countDocuments({ userId, isDeleted: false }),
      Resume.findOne({ userId, isDefault: true, isDeleted: false }),
      MentorProfile.findOne({ userId }).select("profileVisibility").lean()
    ]);

  const profileSkills = normalizeKeywords(skills.map((skill) => skill.skillName));
  const verifiedSkills = normalizeKeywords(skills.filter((skill) => skill.verified).map((skill) => skill.skillName));
  const advancedSkills = normalizeKeywords(
    skills.filter((skill) => skill.level === "advanced" || skill.level === "expert").map((skill) => skill.skillName)
  );
  const skillTags = normalizeKeywords(skills.flatMap((skill) => skill.tags || []));

  const educationSkills = normalizeKeywords(education.flatMap((item) => item.skillsExtracted || []));
  const experienceSkills = normalizeKeywords(experience.flatMap((item) => item.skillsUsed || []));
  const projectSkills = normalizeKeywords(
    publicProjects.flatMap((project) => [...(project.techStack || []), ...(project.skillsExtracted || [])])
  );
  const resumeSkills = normalizeKeywords(resume ? resume.extractedSkills : []);

  const mergedSkills = normalizeSkillList([
    ...profileSkills,
    ...verifiedSkills,
    ...advancedSkills,
    ...skillTags,
    ...educationSkills,
    ...experienceSkills,
    ...projectSkills,
    ...resumeSkills
  ]);

  const companies = normalizeKeywords([
    profile?.currentCompany,
    ...experience.map((item) => item.company)
  ]);

  const educationSnapshots = education.map((item) => ({
    institution: item.institution || "",
    degree: item.degree || "",
    branch: item.branch || "",
    specialization: item.specialization || "",
    educationLevel: item.educationLevel || "",
    current: !!item.current,
    startYear: nullableYear(item.startYear),
    endYear: nullableYear(item.endYear),
    skills: normalizeKeywords(item.skillsExtracted || [])
  }));

  const experienceSnapshots = experience.map((item) => ({
    company: item.company || "",
    position: item.position || "",
    employmentType: item.employmentType || "",
    industry: item.industry || "",
    currentlyWorking: !!item.currentlyWorking,
    skills: normalizeKeywords(item.skillsUsed || [])
  }));

  const projectSnapshots = publicProjects.map((project) => ({
    title: project.title || "",
    projectType: project.projectType || "",
    status: project.status || "",
    deployed: !!project.deployed,
    featured: !!project.featured,
    projectScore: project.projectScore || 0,
    skills: normalizeSkillList([...(project.techStack || []), ...(project.skillsExtracted || [])])
  }));

  const totalDeployedProjects = publicProjects.filter((project) => project.deployed).length;
  const totalFeaturedProjects = publicProjects.filter((project) => project.featured).length;

  const searchKeywords = normalizeSearchKeywords([
    profile?.fullName,
    user?.username,
    profile?.headline,
    profile?.branch,
    profile?.department,
    profile?.currentCompany,
    profile?.currentRole,
    profile?.location,
    ...companies,
    ...mergedSkills
  ]);

  const profileCompletion = profile?.profileCompletion || 0;
  const recommendationEnabled = !!profile?.recommendationEnabled;

  const searchScoreInput = {
    profileCompletion,
    totalSkills: profileSkills.length,
    totalVerifiedSkills: verifiedSkills.length,
    totalAdvancedSkills: advancedSkills.length,
    totalProjects: publicProjects.length,
    totalDeployedProjects,
    totalFeaturedProjects,
    totalExperiences: experience.length,
    totalEducation: education.length,
    resumeUploaded: !!resume,
    totalResumeSkills: resumeSkills.length,
    lastActiveAt: profile?.lastActiveAt || user?.lastSeenAt || null
  };

  const searchScore = calculateSearchScore(searchScoreInput);

  const searchProfileData = {
    userId,
    username: user?.username || "",
    fullName: profile?.fullName || "",
    role: profile?.role || user?.role || "student",
    isMentor: !!profile?.isMentor,
    mentorProfileVisibility: mentorProfile?.profileVisibility || "public",
    avatar: profile?.avatar || "",
    headline: profile?.headline || "",
    bio: profile?.bio || "",
    branch: profile?.branch || "",
    department: profile?.department || "",
    currentCompany: profile?.currentCompany || "",
    currentRole: profile?.currentRole || "",
    location: profile?.location || "",
    passoutYear: nullableYear(profile?.passoutYear),
    visibility: profile?.visibility || "public",

    profileSkills,
    verifiedSkills,
    advancedSkills,
    skillTags,
    educationSkills,
    projectSkills,
    experienceSkills,
    resumeSkills,
    mergedSkills,
    searchKeywords,

    education: educationSnapshots,
    latestEducation: pickLatestEducation(education),

    companies,
    experiences: experienceSnapshots,
    latestExperience: pickLatestExperience(experience),

    projects: projectSnapshots,

    profileCompletion,
    recommendationEnabled,
    searchScore,

    totalSkills: profileSkills.length,
    totalVerifiedSkills: verifiedSkills.length,
    totalAdvancedSkills: advancedSkills.length,
    totalProjects: totalProjectCount,
    totalPublicProjects: publicProjects.length,
    totalDeployedProjects,
    totalFeaturedProjects,
    totalExperiences: experience.length,
    totalEducation: education.length,
    resumeUploaded: !!resume,
    totalResumeSkills: resumeSkills.length,

    lastActiveAt: profile?.lastActiveAt || user?.lastSeenAt || new Date(),
    generatedAt: new Date()
  };

  const searchProfile = await SearchProfile.findOneAndUpdate(
    { userId },
    { $set: searchProfileData },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return searchProfile;
};

module.exports = {
  buildSearchProfile
};