// backend/src/modules/resume-parser/constants/sectionWeights.js
const SECTION_WEIGHTS=Object.freeze({
skills:100,
projects:85,
experience:90,
certifications:75,
education:65,
summary:55,
unclassified:45
});

const DEFAULT_SECTION_WEIGHT=SECTION_WEIGHTS.unclassified;
const FREQUENCY_BONUS_PER_MENTION=3;
const MAX_FREQUENCY_BONUS=12;
const MAX_CONFIDENCE_SCORE=100;
const MIN_CONFIDENCE_SCORE=30;

module.exports={
SECTION_WEIGHTS,
DEFAULT_SECTION_WEIGHT,
FREQUENCY_BONUS_PER_MENTION,
MAX_FREQUENCY_BONUS,
MAX_CONFIDENCE_SCORE,
MIN_CONFIDENCE_SCORE
};