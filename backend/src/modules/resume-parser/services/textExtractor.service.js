// backend/src/modules/resume-parser/services/textExtractor.service.js
const normalizeUnicode = (text) => {
  return text
    .replace(/\u00A0/g, " ")
    .replace(/\u2022|\u25CF|\u25AA|\u2023/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-");
};

const normalizeWhitespace = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\t+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
};

const removeDuplicateLines = (text) => {
  const lines = text.split("\n");
  const result = [];
  let previousLine = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      result.push(line);
      previousLine = null;
      continue;
    }
    if (trimmed === previousLine) {
      continue;
    }
    result.push(line);
    previousLine = trimmed;
  }
  return result.join("\n");
};

const normalizeContactInfo = (text) => {
  return text
    .replace(/([a-zA-Z0-9._-]+)\s*@\s*([a-zA-Z0-9.-]+)\s*\.\s*([a-zA-Z]{2,})/g, "$1@$2.$3")
    .replace(/(https?:\/\/)\s+/g, "$1");
};

const normalizeBullets = (text) => {
  return text.replace(/^[-*•‣▪]\s*/gm, "- ");
};

const splitIntoLines = (text) => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const RESUME_SECTION_PATTERNS = {
  skills: /^(technical\s+)?skills?(set)?([\s/&,]+(technologies|tech\s+stack))?:?$/i,
  experience: /^(work\s+)?experience:?$/i,
  education: /^education:?$/i,
  projects: /^projects?:?$/i,
  certifications: /^certifications?:?$/i,
  summary: /^(summary|objective|profile):?$/i
};

const detectSections = (lines) => {
  const sections = {};
  let currentSection = "unclassified";
  sections[currentSection] = [];
  for (const line of lines) {
    let matchedSection = null;
    for (const [sectionName, pattern] of Object.entries(RESUME_SECTION_PATTERNS)) {
      if (pattern.test(line)) {
        matchedSection = sectionName;
        break;
      }
    }
    if (matchedSection) {
      currentSection = matchedSection;
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }
    sections[currentSection].push(line);
  }
  return sections;
};

const extractCleanText = (rawText) => {
  if (!rawText || typeof rawText !== "string") {
    return { cleanText: "", lines: [], sections: {} };
  }
  let text = normalizeUnicode(rawText);
  text = normalizeContactInfo(text);
  text = normalizeBullets(text);
  text = normalizeWhitespace(text);
  text = removeDuplicateLines(text);
  const lines = splitIntoLines(text);
  const sections = detectSections(lines);
  return {
    cleanText: text,
    lines,
    sections
  };
};

module.exports = {
  extractCleanText,
  normalizeUnicode,
  normalizeWhitespace,
  removeDuplicateLines,
  normalizeContactInfo,
  normalizeBullets,
  splitIntoLines,
  detectSections,
  RESUME_SECTION_PATTERNS
};