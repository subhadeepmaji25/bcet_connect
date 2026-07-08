// backend/src/modules/recommendation/services/eligibility.service.js

const { normalizeText } = require("../utils/normalization");
const isJobOpenForRecommendation = (job) => {
  if (!job) return false;
  if (job.isDeleted) return false;
  if (job.isArchived) return false;
  if (job.status !== "approved") return false;
  if (job.deadline && new Date() > new Date(job.deadline)) return false;
  return true;
};
const isRoleEligible = (job, candidateRole) => {
  const role = normalizeText(candidateRole).toLowerCase();
  if (!role) return false;

  const allowedRoles = job?.eligibility?.allowedRoles;
  const targetRoles = job?.targetRoles;

  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.map((r) => String(r).toLowerCase()).includes(role)) {
      return false;
    }
  }

  if (Array.isArray(targetRoles) && targetRoles.length > 0) {
    if (!targetRoles.map((r) => String(r).toLowerCase()).includes(role)) {
      return false;
    }
  }

  return true;
};
const isBranchEligible = (job, candidateBranch) => {
  const allowedBranches = job?.eligibility?.allowedBranches;

  if (!Array.isArray(allowedBranches) || allowedBranches.length === 0) {
    return true;
  }

  const branch = normalizeText(candidateBranch).toLowerCase();
  if (!branch) return false;

  return allowedBranches
    .map((b) => normalizeText(b).toLowerCase())
    .includes(branch);
};

const isCGPAEligible = (job, candidateCGPA) => {
  const minimumCGPA = Number(job?.eligibility?.minimumCGPA || 0);
  if (!minimumCGPA || minimumCGPA <= 0) return true;
  if (candidateCGPA === null || candidateCGPA === undefined) return true;
  return Number(candidateCGPA) >= minimumCGPA;
};
const isPassoutYearEligible = (job, candidatePassoutYear) => {
  const passoutYears = job?.eligibility?.passoutYears;

  if (!Array.isArray(passoutYears) || passoutYears.length === 0) {
    return true;
  }

  if (!candidatePassoutYear) return false;

  return passoutYears.map(Number).includes(Number(candidatePassoutYear));
};
const isBacklogEligible = (job, candidateBacklogCount = null) => {
  const backlogsAllowed = job?.eligibility?.backlogsAllowed;
  if (backlogsAllowed === false) {
    if (candidateBacklogCount === null || candidateBacklogCount === undefined) {
      // Data hi track nahi ho raha — abhi ke liye benefit of doubt.
      return true;
    }
    return Number(candidateBacklogCount) === 0;
  }
  return true;
};

const checkEligibility = (candidate = {}, job) => {
  const reasons = [];

  if (!isJobOpenForRecommendation(job)) {
    reasons.push("Job is not currently open for applications");
  }

  if (!isRoleEligible(job, candidate.role)) {
    reasons.push("Your role is not eligible for this job");
  }

  if (!isBranchEligible(job, candidate.branch)) {
    reasons.push("Your branch does not match this job's eligible branches");
  }

  if (!isCGPAEligible(job, candidate.cgpa)) {
    reasons.push(
      `Minimum CGPA required is ${job?.eligibility?.minimumCGPA}`
    );
  }

  if (!isPassoutYearEligible(job, candidate.passoutYear)) {
    reasons.push("Your passout year does not match this job's requirement");
  }

  if (!isBacklogEligible(job, candidate.backlogCount)) {
    reasons.push("This job does not accept candidates with active backlogs");
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
};

module.exports = {
  isJobOpenForRecommendation,
  isRoleEligible,
  isBranchEligible,
  isCGPAEligible,
  isPassoutYearEligible,
  isBacklogEligible,
  checkEligibility
};