// backend/src/engines/search-profile/calculateSearchScore.js
//
// Pure function: takes a flat snapshot of "how rich is this profile for
// search purposes" and returns a single 0-100 relevance/quality score used
// to rank SearchProfile documents. Deliberately has zero DB access so it's
// trivially unit-testable and reusable from buildSearchProfile.js.

const MAX_SCORE = 100;

const WEIGHTS = {
  profileCompletion: 40,
  skills: 20,
  projects: 15,
  experience: 5,
  education: 5,
  resume: 10,
  activity: 5
};

const clamp = (value, min = 0, max = Number.POSITIVE_INFINITY) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return min;
  }
  return Math.min(Math.max(number, min), max);
};

const ratio = (value, max) => {
  if (!max || max <= 0) {
    return 0;
  }
  return clamp(value, 0, max) / max;
};

const getActivityRatio = (lastActiveAt) => {
  if (!lastActiveAt) {
    return 0;
  }
  const lastActiveTime = new Date(lastActiveAt).getTime();
  if (!Number.isFinite(lastActiveTime)) {
    return 0;
  }
  const daysSinceActive = (Date.now() - lastActiveTime) / (1000 * 60 * 60 * 24);
  if (daysSinceActive <= 7) {
    return 1;
  }
  if (daysSinceActive <= 30) {
    return 0.7;
  }
  if (daysSinceActive <= 90) {
    return 0.35;
  }
  return 0;
};

const calculateSearchScore = ({
  profileCompletion = 0,
  totalSkills = 0,
  totalVerifiedSkills = 0,
  totalAdvancedSkills = 0,
  totalProjects = 0,
  totalDeployedProjects = 0,
  totalFeaturedProjects = 0,
  totalExperiences = 0,
  totalEducation = 0,
  resumeUploaded = false,
  totalResumeSkills = 0,
  lastActiveAt = null
} = {}) => {
  const completionScore = ratio(profileCompletion, 100) * WEIGHTS.profileCompletion;

  const skillScore =
    ratio(totalSkills, 10) * 14 +
    ratio(totalAdvancedSkills, 4) * 3 +
    ratio(totalVerifiedSkills, 4) * 3;

  const projectScore =
    ratio(totalProjects, 3) * 10 +
    ratio(totalDeployedProjects, 2) * 3 +
    ratio(totalFeaturedProjects, 2) * 2;

  const experienceScore = ratio(totalExperiences, 2) * WEIGHTS.experience;
  const educationScore = ratio(totalEducation, 1) * WEIGHTS.education;
  const resumeScore = resumeUploaded ? 7 + ratio(totalResumeSkills, 8) * 3 : 0;
  const activityScore = getActivityRatio(lastActiveAt) * WEIGHTS.activity;

  const finalScore =
    completionScore + skillScore + projectScore + experienceScore + educationScore + resumeScore + activityScore;

  return Math.min(Math.round(finalScore), MAX_SCORE);
};

module.exports = calculateSearchScore;