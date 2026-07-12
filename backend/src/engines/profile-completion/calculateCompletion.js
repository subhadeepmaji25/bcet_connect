// backend/src/engines/profile-completion/calculateCompletion.js
//
// UPDATED (Phase 1 follow-up — Events integration): added a 6th
// scoring component, events, driven by EventAttendance/EventCertificate
// counts. This closes the gap flagged in the phased upgrade plan:
// "eventCertificate.service.js:134 calls syncUserIntelligence(userId)
// after certificate issue ... but calculateCompletion.js has no
// event/certificate scoring logic — hook fires but nothing updates."
//
// Existing WEIGHTS were 20/20/20/20/20 (100 total). Adding a 6th
// component at full weight would push the ceiling past 100, so all six
// are rebalanced to sum back to exactly 100 — same total, same 0-100
// scale on Profile.profileCompletion, just split six ways instead of
// five: 17+17+17+17+16+16 = 100.
const Profile = require("../../modules/users/models/Profile");
const Skill = require("../../modules/users/models/Skill");
const Education = require("../../modules/users/models/Education");
const Project = require("../../modules/users/models/Project");
const Resume = require("../../modules/users/models/Resume");
const EventAttendance = require("../../modules/events/models/EventAttendance");
const EventCertificate = require("../../modules/events/models/EventCertificate");

const WEIGHTS = {
  profile: 17,
  skills: 17,
  education: 17,
  projects: 17,
  resume: 16,
  events: 16
};
const RESUME_UPLOAD_ONLY_CREDIT_RATIO = 0.3;

// Events component targets — deliberately modest counts (not "10
// skills"/"5 projects" scale) since attending events and earning
// certificates is a slower-accruing signal than adding a skill or
// uploading a resume; hitting the target should still feel achievable
// within a normal semester rather than requiring years of participation.
const EVENT_ATTENDANCE_TARGET = 5;
const EVENT_CERTIFICATE_TARGET = 3;

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

// Split evenly between "showed up" (attendance) and "completed the
// full loop, earned proof" (certificate) — a certificate implies
// attendance already happened (see EventCertificate.js's model
// comment: "only ever created after EventAttendance + Event COMPLETED
// both hold true"), but attendance alone without ever converting to a
// certificate still deserves partial credit, so the two are scored
// independently rather than certificate count alone gating the whole
// component.
const calculateEventScore = (attendanceCount, certificateCount) => {
  if (!attendanceCount && !certificateCount) return 0;

  const attendanceWeight = WEIGHTS.events * 0.5;
  const certificateWeight = WEIGHTS.events * 0.5;

  const attendanceScore = Math.min(attendanceCount / EVENT_ATTENDANCE_TARGET, 1) * attendanceWeight;
  const certificateScore = Math.min(certificateCount / EVENT_CERTIFICATE_TARGET, 1) * certificateWeight;

  return Math.round(attendanceScore + certificateScore);
};

const calculateCompletion = async (userId) => {
  const [profile, skills, education, projects, resumes, attendanceCount, certificateCount] = await Promise.all([
    Profile.findOne({ userId }),
    Skill.find({ userId }),
    Education.find({ userId }),
    Project.find({ userId, visibility: "public", isDeleted: false }),
    Resume.find({ userId, isDeleted: false }),
    EventAttendance.countDocuments({ userId }),
    EventCertificate.countDocuments({ userId })
  ]);

  const profileScore = calculateProfileScore(profile);
  const skillScore = calculateSkillScore(skills);
  const educationScore = calculateEducationScore(education);
  const projectScore = calculateProjectScore(projects);
  const resumeScore = calculateResumeScore(resumes);
  const eventScore = calculateEventScore(attendanceCount, certificateCount);

  const totalCompletion =
    profileScore + skillScore + educationScore + projectScore + resumeScore + eventScore;
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
    eventScore,
    totalCompletion,
    recommendationEnabled,
    justCompleted
  };
};

module.exports = {
  calculateCompletion
};