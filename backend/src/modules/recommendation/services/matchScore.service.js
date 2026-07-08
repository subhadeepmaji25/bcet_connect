// backend/src/modules/recommendation/services/matchScore.service.js
const { checkEligibility } = require("./eligibility.service");
const { matchCombinedSkills, computeSkillOverlap } = require("../utils/skillMatcher");
const {
  calculateWeightedScore,
  calculateExperienceScore,
  calculateEducationScore,
  getMatchLabel
} = require("../utils/scoreCalculator");
const calculateJobMatch = (candidateContext = {}, job) => {
  const eligibility = checkEligibility(candidateContext, job);

  const requiredSkills = job?.requiredSkills || [];
  const preferredSkills = job?.preferredSkills || [];
  const requiredOverlap = computeSkillOverlap(candidateContext.mergedSkills, requiredSkills);
  const preferredOverlap = computeSkillOverlap(candidateContext.mergedSkills, preferredSkills);
  const resumeOverlap = matchCombinedSkills(
    candidateContext.resumeSkills,
    requiredSkills,
    preferredSkills
  );
  const projectOverlap = matchCombinedSkills(
    candidateContext.projectSkills,
    requiredSkills,
    preferredSkills
  );

  const experienceScore = calculateExperienceScore(
    candidateContext.experienceMonths,
    job.minExperienceYears
  );

  const educationScore = calculateEducationScore({
    candidateCGPA: candidateContext.cgpa,
    minimumCGPA: job?.eligibility?.minimumCGPA,
    candidateBranch: candidateContext.branch,
    allowedBranches: job?.eligibility?.allowedBranches
  });

  const categoryScores = {
    requiredSkills: requiredOverlap.matchPercentage,
    preferredSkills: preferredOverlap.matchPercentage,
    resume: resumeOverlap.matchPercentage,
    projects: projectOverlap.matchPercentage,
    experience: experienceScore,
    education: educationScore
  };

  const finalScore = calculateWeightedScore(categoryScores);

  return {
    jobId: job._id,
    eligible: eligibility.eligible,
    ineligibleReasons: eligibility.reasons,
    finalScore,
    matchLabel: getMatchLabel(finalScore),
    categoryScores,
    skillBreakdown: {
      requiredSkills: {
        matched: requiredOverlap.matchedSkills,
        missing: requiredOverlap.missingSkills,
        matchPercentage: requiredOverlap.matchPercentage
      },
      preferredSkills: {
        matched: preferredOverlap.matchedSkills,
        missing: preferredOverlap.missingSkills,
        matchPercentage: preferredOverlap.matchPercentage
      }
    }
  };
};

module.exports = {
  calculateJobMatch
};