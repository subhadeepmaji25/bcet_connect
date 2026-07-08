// backend/src/modules/recommendation/utils/skillMatcher.js
const { normalizeSkillList, toSkillSet } = require("./normalization");
const computeSkillOverlap = (candidateSkills = [], targetSkills = []) => {
  const normalizedTarget = normalizeSkillList(targetSkills);

  if (normalizedTarget.length === 0) {
    return {
      matchedSkills: [],
      missingSkills: [],
      matchCount: 0,
      targetCount: 0,
      matchPercentage: 100
    };
  }

  const candidateSet = toSkillSet(candidateSkills);

  const matchedSkills = normalizedTarget.filter((skill) =>
    candidateSet.has(skill)
  );
  const missingSkills = normalizedTarget.filter(
    (skill) => !candidateSet.has(skill)
  );

  const matchPercentage = Math.round(
    (matchedSkills.length / normalizedTarget.length) * 100
  );

  return {
    matchedSkills,
    missingSkills,
    matchCount: matchedSkills.length,
    targetCount: normalizedTarget.length,
    matchPercentage
  };
};
const matchAgainstCandidateSkills = (candidateSkills, requiredSkills, preferredSkills) => {
  return {
    required: computeSkillOverlap(candidateSkills, requiredSkills),
    preferred: computeSkillOverlap(candidateSkills, preferredSkills)
  };
};
const matchCombinedSkills = (sourceSkills, requiredSkills = [], preferredSkills = []) => {
  const combinedTarget = [...requiredSkills, ...preferredSkills];
  return computeSkillOverlap(sourceSkills, combinedTarget);
};

module.exports = {
  computeSkillOverlap,
  matchAgainstCandidateSkills,
  matchCombinedSkills
};