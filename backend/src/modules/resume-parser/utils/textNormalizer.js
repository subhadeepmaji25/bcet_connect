// backend/src/modules/resume-parser/utils/textNormalizer.js
const SAFE_SKILL_CHARACTERS = /[^\w\s+#.\-]/g;

const prepareSearchableText = (text) => {
  if (!text) return " ";
  return ` ${String(text)
    .toLowerCase()
    .replace(SAFE_SKILL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
};

const prepareHyphenNormalizedText = (text) => {
  if (!text) return " ";
  return ` ${String(text)
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(SAFE_SKILL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
};

const tokenize = (searchableText) => {
  return searchableText.split(" ").filter(Boolean);
};

module.exports = {
  SAFE_SKILL_CHARACTERS,
  prepareSearchableText,
  prepareHyphenNormalizedText,
  tokenize
};