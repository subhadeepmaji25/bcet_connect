// backend/src/modules/resume-parser/services/skillExtractor.service.js
//
// FIX: was importing from "../../../shared/utils/skillNormalizer" — a
// second, independently-maintained copy of the alias dictionary that
// got created by mistake. Reverted to the ONE real source of truth,
// which recommendation/eligibility/matchScore/project.service.js all
// already use. Never let this import drift again — if a shared
// location is genuinely wanted later, MOVE normalization.js there and
// update every consumer in the same change, don't fork it.
const { normalizeSkillToken, SKILL_ALIASES, expandCompositeSkills } = require("../../recommendation/utils/normalization");
const { KNOWN_SKILLS, KNOWN_SKILL_SET, getCategoryBySkill } = require("../utils/commonSkills");
const { prepareSearchableText, prepareHyphenNormalizedText, tokenize } = require("../utils/textNormalizer");
const { SECTION_WEIGHTS, DEFAULT_SECTION_WEIGHT, FREQUENCY_BONUS_PER_MENTION, MAX_FREQUENCY_BONUS, MAX_CONFIDENCE_SCORE, MIN_CONFIDENCE_SCORE } = require("../constants/sectionWeights");

const SAFE_KNOWN_SKILLS = Array.isArray(KNOWN_SKILLS) ? KNOWN_SKILLS : [];
const SAFE_SKILL_ALIASES = SKILL_ALIASES && typeof SKILL_ALIASES === "object" ? SKILL_ALIASES : {};
const MULTI_WORD_SKILLS = SAFE_KNOWN_SKILLS.filter((skill) => skill.includes(" "));
const SINGLE_WORD_SKILL_SET = new Set(SAFE_KNOWN_SKILLS.filter((skill) => !skill.includes(" ")));

const MULTI_WORD_PATTERNS = MULTI_WORD_SKILLS.map((skill) => {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { skill, pattern: new RegExp(`\\s${escaped}\\s`, "gi") };
});

const ALIAS_PATTERNS = Object.entries(SAFE_SKILL_ALIASES).map(([alias, canonical]) => {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { canonical, pattern: new RegExp(`[\\s,;:/|]${escaped}[\\s,;:/|.]`, "gi") };
});

const countMultiWordMatches = (searchableText) => {
  const counts = new Map();
  if (!searchableText) return counts;
  for (const { skill, pattern } of MULTI_WORD_PATTERNS) {
    const matches = searchableText.match(pattern);
    if (matches && matches.length > 0) {
      counts.set(skill, (counts.get(skill) || 0) + matches.length);
    }
  }
  return counts;
};

const countSingleWordMatches = (searchableText) => {
  const counts = new Map();
  if (!searchableText) return counts;
  const tokens = tokenize(searchableText) || [];
  for (const token of tokens) {
    const normalized = normalizeSkillToken(token);
    if (SINGLE_WORD_SKILL_SET.has(normalized)) {
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    }
    const expanded = expandCompositeSkills(token);
    if (expanded) {
      for (const impliedSkill of expanded) {
        if (KNOWN_SKILL_SET.has(impliedSkill)) {
          counts.set(impliedSkill, (counts.get(impliedSkill) || 0) + 1);
        }
      }
    }
  }
  return counts;
};

const countAliasMatches = (rawText) => {
  const counts = new Map();
  if (!rawText) return counts;
  const lowerText = ` ${rawText.toLowerCase()} `;
  for (const { canonical, pattern } of ALIAS_PATTERNS) {
    if (!KNOWN_SKILL_SET.has(canonical)) continue;
    const matches = lowerText.match(pattern);
    if (matches && matches.length > 0) {
      counts.set(canonical, (counts.get(canonical) || 0) + matches.length);
    }
  }
  return counts;
};

const mergeCounts = (...maps) => {
  const merged = new Map();
  for (const map of maps) {
    for (const [skill, count] of map.entries()) {
      merged.set(skill, (merged.get(skill) || 0) + count);
    }
  }
  return merged;
};

const calculateConfidence = (sectionsFoundIn = [], totalMentions = 0) => {
  const bestSectionWeight = sectionsFoundIn.length > 0 ? Math.max(...sectionsFoundIn.map((s) => SECTION_WEIGHTS[s] ?? DEFAULT_SECTION_WEIGHT)) : DEFAULT_SECTION_WEIGHT;
  const frequencyBonus = Math.min(MAX_FREQUENCY_BONUS, Math.max(0, totalMentions - 1) * FREQUENCY_BONUS_PER_MENTION);
  const rawScore = bestSectionWeight + frequencyBonus;
  return Math.min(MAX_CONFIDENCE_SCORE, Math.max(MIN_CONFIDENCE_SCORE, Math.round(rawScore)));
};

const extractSkillsWithConfidence = (cleanTextResult) => {
  const { cleanText, sections } = cleanTextResult;
  const sectionEntries = Object.entries(sections || {});
  const fullText = cleanText || "";
  const skillTracker = new Map();
  const trackSkill = (skill, sectionName, mentionCount) => {
    if (!skillTracker.has(skill)) {
      skillTracker.set(skill, { sectionsFoundIn: new Set(), totalMentions: 0 });
    }
    const entry = skillTracker.get(skill);
    entry.sectionsFoundIn.add(sectionName);
    entry.totalMentions += mentionCount;
  };
  for (const [sectionName, lines] of sectionEntries) {
    const sectionText = (lines || []).join(" ");
    if (!sectionText.trim()) continue;
    const searchableSpaced = prepareSearchableText(sectionText);
    const searchableHyphenNormalized = prepareHyphenNormalizedText(sectionText);
    const multiWordCounts = mergeCounts(countMultiWordMatches(searchableSpaced), countMultiWordMatches(searchableHyphenNormalized));
    const singleWordCounts = countSingleWordMatches(searchableSpaced);
    const aliasCounts = countAliasMatches(sectionText);
    const combined = mergeCounts(multiWordCounts, singleWordCounts, aliasCounts);
    for (const [skill, count] of combined.entries()) {
      trackSkill(skill, sectionName, count);
    }
  }
  const searchableFullSpaced = prepareSearchableText(fullText);
  const searchableFullHyphen = prepareHyphenNormalizedText(fullText);
  const fullTextCombined = mergeCounts(countMultiWordMatches(searchableFullSpaced), countMultiWordMatches(searchableFullHyphen), countSingleWordMatches(searchableFullSpaced), countAliasMatches(fullText));
  for (const [skill, count] of fullTextCombined.entries()) {
    if (!skillTracker.has(skill)) {
      trackSkill(skill, "unclassified", count);
    }
  }
  const detailedSkills = [...skillTracker.entries()].map(([skill, { sectionsFoundIn, totalMentions }]) => {
    const sectionsArray = [...sectionsFoundIn];
    const confidenceScore = calculateConfidence(sectionsArray, totalMentions);
    return {
      skill,
      category: getCategoryBySkill(skill) || "uncategorized",
      confidenceScore,
      confidenceLevel: confidenceScore >= 75 ? "High" : confidenceScore >= 50 ? "Medium" : "Low",
      frequency: totalMentions,
      sections: sectionsArray
    };
  }).sort((a, b) => b.confidenceScore - a.confidenceScore || a.skill.localeCompare(b.skill));
  const allSkills = detailedSkills.map((entry) => entry.skill).sort();
  const highConfidenceSkills = detailedSkills.filter((entry) => entry.confidenceLevel === "High").map((entry) => entry.skill).sort();
  const lowConfidenceSkills = detailedSkills.filter((entry) => entry.confidenceLevel !== "High").map((entry) => entry.skill).sort();
  return {
    skills: allSkills,
    highConfidenceSkills,
    lowConfidenceSkills,
    detailedSkills
  };
};

const extractSkills = (cleanTextResult) => {
  if (!cleanTextResult || !cleanTextResult.cleanText) {
    return { skills: [], highConfidenceSkills: [], lowConfidenceSkills: [], detailedSkills: [] };
  }
  return extractSkillsWithConfidence(cleanTextResult);
};

module.exports = {
  extractSkills,
  extractSkillsWithConfidence,
  calculateConfidence
};