// backend/src/modules/feed/services/feedModeration.service.js
const ApiError = require("../../../shared/errors/ApiError");
const { MODERATION_STATUS } = require("../constants/feed.constants");

const BLOCKED_TERMS = Object.freeze([
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "chutiya",
  "madarchod",
  "bhosdike",
  "gandu",
  "randi"
]);

const HIGH_RISK_PATTERNS = Object.freeze([
  /\bkill\s+(yourself|urself|u)\b/i,
  /\bgo\s+die\b/i,
  /\bsuicide\b/i
]);

const normalize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[@$!0]/g, (ch) => ({ "@": "a", "$": "s", "!": "i", "0": "o" }[ch] || ch))
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const inspectContent = (content = "") => {
  const normalized = normalize(content);
  const reasons = [];

  BLOCKED_TERMS.forEach((term) => {
    const re = new RegExp(`\\b${term}\\b`, "i");
    if (re.test(normalized)) reasons.push(`blocked_term:${term}`);
  });

  HIGH_RISK_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) reasons.push(`high_risk_pattern:${index}`);
  });

  const status = reasons.length ? MODERATION_STATUS.BLOCKED : MODERATION_STATUS.APPROVED;
  return { status, reasons };
};

const assertContentAllowed = (content, targetLabel = "content") => {
  const result = inspectContent(content);
  if (result.status === MODERATION_STATUS.BLOCKED) {
    throw ApiError.badRequest(`This ${targetLabel} violates feed community guidelines.`);
  }
  return result;
};

module.exports = {
  inspectContent,
  assertContentAllowed
};
