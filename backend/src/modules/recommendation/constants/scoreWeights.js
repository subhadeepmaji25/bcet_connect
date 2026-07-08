// backend/src/modules/recommendation/constants/scoreWeights.js

// Total must always sum to 100. Product/business logic badalne par
// sirf yahi file touch karni hai — baaki koi file me hardcoded % nahi hai.
const SCORE_WEIGHTS = Object.freeze({
  requiredSkills: 40,
  preferredSkills: 10,
  resume: 15,
  projects: 15,
  experience: 10,
  education: 10
});

const TOTAL_WEIGHT = Object.values(SCORE_WEIGHTS).reduce(
  (sum, weight) => sum + weight,
  0
);

if (TOTAL_WEIGHT !== 100) {
  // Fail fast at boot time agar kisi ne weights galat set kar diye
  throw new Error(
    `SCORE_WEIGHTS must sum to 100, currently sums to ${TOTAL_WEIGHT}`
  );
}

// Is threshold se neeche score wali jobs "recommended" list me nahi
// dikhengi (eligible hone ke bawajood) — sirf noise filter karta hai
const RECOMMENDATION_MIN_SCORE = 50;

// Isse upar match ko "Strong Match" label milta hai (MATCH_LABELS me use hota hai)
const STRONG_MATCH_SCORE = 75;

// Jab tak profile itna complete na ho, recommendations unlock nahi hongi
const MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION = 60;

// Agar job ko koi minimum experience nahi chahiye, to experience category
// full marks deta hai (candidate ko punish nahi karta uski wajah se jo job maangta hi nahi)
const EXPERIENCE_NOT_REQUIRED_SCORE = 100;

const MATCH_LABELS = Object.freeze([
  { min: 85, label: "Excellent Match" },
  { min: STRONG_MATCH_SCORE, label: "Strong Match" },
  { min: RECOMMENDATION_MIN_SCORE, label: "Good Match" },
  { min: 25, label: "Partial Match" },
  { min: 0, label: "Weak Match" }
]);

// ── BUG FIX ──
// recommendation.service.js ke loadCandidateJobPool() me
// `.limit(RECOMMENDATION_SCAN_LIMIT)` call hota hai, lekin ye constant
// yahan export hi nahi ho raha tha. Result: .limit(undefined) = no limit
// = har recommendation request pe SAARI approved jobs scan hoti thi,
// bina kisi cap ke. Ye exactly wahi safety cap hai jo missing tha.
const RECOMMENDATION_SCAN_LIMIT = 300;

module.exports = {
  SCORE_WEIGHTS,
  RECOMMENDATION_MIN_SCORE,
  STRONG_MATCH_SCORE,
  MIN_PROFILE_COMPLETION_FOR_RECOMMENDATION,
  EXPERIENCE_NOT_REQUIRED_SCORE,
  MATCH_LABELS,
  RECOMMENDATION_SCAN_LIMIT
};