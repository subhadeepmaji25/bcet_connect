// backend/src/modules/recommendation/utils/scoreCalculator.js
const {
  SCORE_WEIGHTS,
  EXPERIENCE_NOT_REQUIRED_SCORE,
  MATCH_LABELS
} = require("../constants/scoreWeights");
const clampPercentage = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, number));
};
const calculateWeightedScore = (categoryScores = {}) => {
  const weightedSum = Object.keys(SCORE_WEIGHTS).reduce((sum, key) => {
    const score = clampPercentage(categoryScores[key]);
    const weight = SCORE_WEIGHTS[key];
    return sum + (score * weight) / 100;
  }, 0);

  return Math.round(weightedSum);
};

const calculateExperienceScore = (candidateExperienceMonths = 0, minExperienceYears = 0) => {
  const requiredMonths = Number(minExperienceYears || 0) * 12;

  if (requiredMonths <= 0) {
    return EXPERIENCE_NOT_REQUIRED_SCORE;
  }

  const candidateMonths = Number(candidateExperienceMonths || 0);

  if (candidateMonths <= 0) {
    return 0;
  }

  if (candidateMonths >= requiredMonths) {
    return 100;
  }

  return Math.round((candidateMonths / requiredMonths) * 100);
};
const calculateEducationScore = ({
  candidateCGPA = null,
  minimumCGPA = 0,
  candidateBranch = "",
  allowedBranches = []
} = {}) => {
  // ---- CGPA component (60%) ----
  let cgpaScore;
  if (!minimumCGPA || minimumCGPA <= 0) {
    cgpaScore = 100;
  } else if (candidateCGPA === null || candidateCGPA === undefined) {
    // CGPA record hi nahi hai -> engine ko pata nahi, neutral-low score do
    // (na 0 kyunki galat punish ho sakta hai, na 100 kyunki verify nahi hua).
    cgpaScore = 40;
  } else if (candidateCGPA >= minimumCGPA) {
    cgpaScore = 100;
  } else {
    cgpaScore = Math.round((candidateCGPA / minimumCGPA) * 100);
  }

  // ---- Branch component (40%) ----
  let branchScore;
  const normalizedAllowed = (allowedBranches || []).map((branch) =>
    String(branch).toLowerCase().trim()
  );
  const normalizedCandidateBranch = String(candidateBranch || "")
    .toLowerCase()
    .trim();

  if (normalizedAllowed.length === 0) {
    branchScore = 100;
  } else if (
    normalizedCandidateBranch &&
    normalizedAllowed.includes(normalizedCandidateBranch)
  ) {
    branchScore = 100;
  } else {
    branchScore = 0;
  }

  return Math.round(cgpaScore * 0.6 + branchScore * 0.4);
};
const getMatchLabel = (finalScore) => {
  const score = clampPercentage(finalScore);
  const found = MATCH_LABELS.find((entry) => score >= entry.min);
  return found ? found.label : "Weak Match";
};

module.exports = {
  clampPercentage,
  calculateWeightedScore,
  calculateExperienceScore,
  calculateEducationScore,
  getMatchLabel
};