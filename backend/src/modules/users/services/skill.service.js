// backend/src/modules/users/services/skill.service.js
const Skill = require("../models/Skill");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const ApiError = require("../../../shared/errors/ApiError");

const ALLOWED_UPDATE_FIELDS = ["skillName","category","level","yearsOfExperience","source","proofs","tags"];

// Bulk-add's per-skill cap. Kept independent of the validator's own
// max-length check so this file has a hard ceiling even if it's ever
// called from somewhere other than the validated HTTP route (e.g. a
// future internal script) — defense in depth, not duplication for its
// own sake.
const BULK_ADD_MAX_SKILLS = 20;

const addSkill = async (userId, payload) => {
  const { skillName, category, level, yearsOfExperience, source, proofs, tags } = payload;
  if (!skillName) {
    throw ApiError.badRequest("Skill name is required");
  }
  const existingSkill = await Skill.findOne({ userId, skillName: skillName.trim().toLowerCase() });
  if (existingSkill) {
    throw ApiError.conflict("Skill already exists");
  }
  const skill = await Skill.create({ userId, skillName: skillName.trim(), category, level, yearsOfExperience, source, proofs, tags });
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Skill added successfully", data: { skill, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

// ─────────────────────────────────────────
// Bulk-add — the bridge for Query 1 (PDF-extracted skills → My Skills,
// after user approval). This is intentionally a SEPARATE function from
// addSkill() rather than a loop calling addSkill() repeatedly, for two
// reasons:
//   1. addSkill() calls syncUserIntelligence() on every single call —
//      looping it for 10-20 skills would mean 10-20 redundant syncs.
//      Bulk-add does the sync exactly once, after all inserts.
//   2. addSkill() throws on the FIRST duplicate it finds, which would
//      abort the whole batch. Bulk-add is expected to silently skip
//      duplicates and add whatever is new — the user approved a list,
//      they shouldn't get an all-or-nothing failure because one of the
//      ten skills happens to already exist.
//
// Frontend flow this supports: resume upload response already returns
// `extractedSkills` (see resume.service.js) → UI shows them as
// "Suggested skills from resume — add to profile?" → user picks which
// ones to keep → this function is called with just those names.
// Ownership/ duplicate-safety is enforced by the same
// {userId, skillName} unique index Skill.js already has, so even a
// race condition (two requests adding the same skill concurrently)
// can't create a duplicate — Mongo's index rejects the second insert.
// ─────────────────────────────────────────
const addSkillsBulk = async (userId, skillNames = [], options = {}) => {
  const { source = "resume" } = options;

  if (!Array.isArray(skillNames) || skillNames.length === 0) {
    throw ApiError.badRequest("At least one skill name is required");
  }
  if (skillNames.length > BULK_ADD_MAX_SKILLS) {
    throw ApiError.badRequest(`Cannot add more than ${BULK_ADD_MAX_SKILLS} skills at once`);
  }

  // Normalize + dedupe the incoming list itself first (case-insensitive,
  // trimmed) — protects against the caller sending ["Python", "python"]
  // in the same request, which the DB-level unique index alone wouldn't
  // catch within a single insertMany batch.
  const seen = new Set();
  const normalized = [];
  for (const rawName of skillNames) {
    if (typeof rawName !== "string") continue;
    const trimmed = rawName.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  if (normalized.length === 0) {
    throw ApiError.badRequest("No valid skill names provided");
  }

  const existingSkills = await Skill.find({
    userId,
    skillName: { $in: normalized.map((name) => name.toLowerCase()) }
  }).select("skillName");
  const existingNames = new Set(existingSkills.map((s) => s.skillName));

  const toCreate = normalized.filter((name) => !existingNames.has(name.toLowerCase()));
  const skippedExisting = normalized.filter((name) => existingNames.has(name.toLowerCase()));

  let created = [];
  if (toCreate.length > 0) {
    try {
      created = await Skill.insertMany(
        toCreate.map((name) => ({ userId, skillName: name, source })),
        { ordered: false } // one duplicate-key failure shouldn't block the rest of the batch
      );
    } catch (err) {
      // insertMany with ordered:false still throws a BulkWriteError if
      // ANY document fails, but successfully inserted docs are kept.
      // err.insertedDocs (Mongoose) / err.result.insertedIds (driver)
      // carries what actually succeeded — fall back to a fresh read if
      // the error shape doesn't expose it directly, so the caller still
      // gets an accurate "what actually got added" answer.
      if (err.insertedDocs) {
        created = err.insertedDocs;
      } else {
        created = await Skill.find({
          userId,
          skillName: { $in: toCreate.map((name) => name.toLowerCase()) }
        });
      }
    }
  }

  const syncResult = await syncUserIntelligence(userId);

  return {
    success: true,
    message: created.length > 0 ? "Skills added successfully" : "No new skills were added",
    data: {
      added: created,
      skippedExisting,
      completion: syncResult.totalCompletion,
      recommendationEnabled: syncResult.recommendationEnabled
    }
  };
};

const updateSkill = async (skillId, userId, payload) => {
  const skill = await Skill.findOne({ _id: skillId, userId });
  if (!skill) {
    throw ApiError.notFound("Skill not found or access denied");
  }
  if (payload.skillName) {
    const normalizedName = payload.skillName.trim().toLowerCase();
    const duplicate = await Skill.findOne({ userId, skillName: normalizedName, _id: { $ne: skillId } });
    if (duplicate) {
      throw ApiError.conflict("A skill with this name already exists");
    }
    payload.skillName = payload.skillName.trim();
  }
  ALLOWED_UPDATE_FIELDS.forEach(field => {
    if (payload[field] !== undefined) {
      skill[field] = payload[field];
    }
  });
  await skill.save();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Skill updated successfully", data: { skill, completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const deleteSkill = async (skillId, userId) => {
  const skill = await Skill.findOne({ _id: skillId, userId });
  if (!skill) {
    throw ApiError.notFound("Skill not found or access denied");
  }
  await skill.deleteOne();
  const syncResult = await syncUserIntelligence(userId);
  return { success: true, message: "Skill deleted successfully", data: { completion: syncResult.totalCompletion, recommendationEnabled: syncResult.recommendationEnabled } };
};

const getUserSkills = async (userId) => {
  return Skill.find({ userId }).sort({ score: -1 });
};

const getSkillById = async (skillId, userId) => {
  const skill = await Skill.findOne({ _id: skillId, userId });
  if (!skill) {
    throw ApiError.notFound("Skill not found or access denied");
  }
  return skill;
};

module.exports = { addSkill, addSkillsBulk, updateSkill, deleteSkill, getUserSkills, getSkillById };
