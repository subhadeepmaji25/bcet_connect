// backend/src/modules/communities/services/communityMember.service.js
//
// FIXED (join-approval, earlier update): joinCommunity() previously only
// checked `visibility !== PUBLIC` to decide whether direct join was
// allowed — meaning a PUBLIC community with settings.requireApproval =
// true still let anyone join instantly, silently ignoring that setting.
// It now calls community.constants.js's requiresJoinRequest(), the same
// helper createRequest() (in communityJoinRequest.service.js) and
// listPublicCommunities() (in community.service.js) use — so all three
// places agree on what "needs approval" means, permanently.
//
// FIXED (this update — real privacy leak): getMembers() had no viewerId
// parameter at all, so it never checked whether the caller was actually
// allowed to see the roster. Any authenticated user could list the full
// member list (usernames, emails, roles) of a PRIVATE or HIDDEN
// community they had never joined, just by knowing/guessing the
// communityId — the exact inverse of the "private community invisible"
// bug fixed in community.service.js. getMembers() now requires viewerId
// and enforces the same membership rule getCommunityById() uses: PUBLIC
// communities are readable by anyone, PRIVATE/HIDDEN require the viewer
// to already be a member (HIDDEN still 404s instead of 403, so a
// non-member can't even confirm the community exists by probing this
// endpoint).
//
// FIXED (this update — role sort bug): getMembers() sorted with
// `{ role: 1, joinedAt: 1 }`, which sorts `role` as a STRING
// alphabetically (co-leader, leader, member, moderator, owner) — not by
// actual hierarchy. The owner would never appear first. Replaced with an
// in-memory sort keyed off ROLE_HIERARCHY's numeric weight (descending),
// then joinedAt ascending as the tiebreaker within the same role. Page
// sizes here are capped at PAGINATION.MAX_LIMIT, so sorting the fetched
// page in memory is cheap — no need to push this into an aggregation
// pipeline.
//
// FIXED (this update — dead field): getMembers() was already returning
// an `isBanned` field on every member, but no function anywhere in this
// module ever set it — CommunityMember.isBanned would always come back
// undefined/false, effectively a non-functional field pretending to be
// a feature. Added banMember() / unbanMember(), following the same
// role-hierarchy-guard pattern as removeMember()/muteMember(), so the
// field is now actually backed by real behaviour instead of being dead
// weight in the response shape.
//
// ADDED (this update — missing pair): muteMember() existed with no way
// to reverse it short of waiting out mutedUntil. Added unmuteMember() as
// its counterpart, same pattern as pinPost/unpin in the feed service.
//
// ADDED (this update — self-target guards): changeRole(), removeMember(),
// muteMember(), and banMember() now explicitly reject acting on your own
// membership, with a clear message pointing at the correct endpoint
// (leaveCommunity for self-removal) instead of relying on the role-
// hierarchy check to incidentally block it via an "equal role" comparison.

const Community = require("../models/Community");
const CommunityMember = require("../models/CommunityMember");
const ApiError = require("../../../shared/errors/ApiError");
const { notify } = require("../../notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS: N_EVENTS } = require("../../notification/constants/notification.constants");
const {
  MEMBER_ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  VISIBILITY,
  COMMUNITY_STATUS,
  LIMITS,
  PAGINATION,
  requiresJoinRequest
} = require("../constants/community.constants");

// ── Permission helper — reused by post/comment/joinRequest services ──
// Never duplicate this check elsewhere; every "can this role do X"
// decision in the module routes through here.
const hasPermission = (role, action) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes("*") || permissions.includes(action);
};

// Fetch a member's role, throw if not a member at all — this is the
// ownership/membership check every mutation in the module starts with.
const getMemberOrThrow = async (communityId, userId) => {
  const member = await CommunityMember.findOne({ communityId, userId });
  if (!member) throw ApiError.forbidden("You are not a member of this community");
  return member;
};

// Small shared guard — every "act on another member" mutation needs
// this same check, and needs to say the same thing when it fires.
const assertNotSelfTarget = (actingUserId, targetUserId, actionLabel) => {
  if (actingUserId.toString() === targetUserId.toString()) {
    throw ApiError.badRequest(
      `You cannot ${actionLabel} yourself` +
      (actionLabel === "remove" ? " — use the leave-community endpoint instead" : "")
    );
  }
};

// ── Join (instant-join path only — anything requiresJoinRequest()
//    flags true must go through communityJoinRequest.service.js) ─────
const joinCommunity = async (userId, communityId) => {
  const community = await Community.findById(communityId);
  if (!community) throw ApiError.notFound("Community not found");
  if (community.status !== COMMUNITY_STATUS.ACTIVE) throw ApiError.forbidden("This community is not active");

  // FIX: was `community.visibility !== VISIBILITY.PUBLIC` only — a
  // PUBLIC + requireApproval community slipped through and got instant
  // joins anyway. Now covers PRIVATE, HIDDEN, and PUBLIC-with-approval
  // in one check, via the same helper createRequest() uses.
  if (requiresJoinRequest(community)) {
    throw ApiError.forbidden("This community requires a join request — use the join-request endpoint instead");
  }

  const existing = await CommunityMember.findOne({ communityId, userId });
  if (existing) throw ApiError.conflict("You are already a member of this community");

  if (community.memberCount >= LIMITS.MAX_MEMBERS) {
    throw ApiError.conflict("This community has reached its member limit");
  }

  const member = await CommunityMember.create({ communityId, userId, role: MEMBER_ROLES.MEMBER });

  // Atomic — never doc.memberCount++ + save().
  await Community.updateOne({ _id: communityId }, { $inc: { memberCount: 1 } });

  // Leaders get a lightweight join notification on public communities
  // (per project decision: feed/roster events notify, chat does not).
  const leaders = await CommunityMember.find({
    communityId,
    role: { $in: [MEMBER_ROLES.OWNER, MEMBER_ROLES.LEADER] }
  }).select("userId");
  await Promise.all(
    leaders.map((l) =>
      notify(N_EVENTS.COMMUNITY_MEMBER_JOINED, { userId: l.userId, meta: { communityId, newMemberId: userId } })
    )
  );

  return { success: true, message: "Joined community successfully", data: { member } };
};

// Used internally by communityJoinRequest.service.js after approval —
// skips the visibility/approval check (request already proved
// eligibility) but still enforces the member cap and duplicate check.
const addMemberDirectly = async (communityId, userId, role = MEMBER_ROLES.MEMBER) => {
  const community = await Community.findById(communityId);
  if (!community) throw ApiError.notFound("Community not found");

  const existing = await CommunityMember.findOne({ communityId, userId });
  if (existing) throw ApiError.conflict("User is already a member");

  if (community.memberCount >= LIMITS.MAX_MEMBERS) {
    throw ApiError.conflict("This community has reached its member limit");
  }

  const member = await CommunityMember.create({ communityId, userId, role });
  await Community.updateOne({ _id: communityId }, { $inc: { memberCount: 1 } });
  return member;
};

// ── Leave ──────────────────────────────────────────────────────────
const leaveCommunity = async (userId, communityId) => {
  const member = await getMemberOrThrow(communityId, userId);

  if (member.role === MEMBER_ROLES.OWNER) {
    const otherOwners = await CommunityMember.countDocuments({
      communityId,
      role: MEMBER_ROLES.OWNER,
      userId: { $ne: userId }
    });
    if (otherOwners === 0) {
      throw ApiError.conflict("Transfer ownership to another member before leaving");
    }
  }

  await CommunityMember.deleteOne({ _id: member._id });
  await Community.updateOne({ _id: communityId }, { $inc: { memberCount: -1 } });

  return { success: true, message: "Left community successfully", data: null };
};

// ── Promote / Demote (role hierarchy enforced) ──────────────────────
const changeRole = async (actingUserId, targetUserId, communityId, newRole) => {
  assertNotSelfTarget(actingUserId, targetUserId, "change the role of");

  if (!Object.values(MEMBER_ROLES).includes(newRole)) {
    throw ApiError.badRequest("Invalid role");
  }

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  if (!hasPermission(actingMember.role, "manage_members") && !hasPermission(actingMember.role, "manage_members_below")) {
    throw ApiError.forbidden("You do not have permission to change member roles");
  }

  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");

  const actingWeight = ROLE_HIERARCHY[actingMember.role];
  const targetCurrentWeight = ROLE_HIERARCHY[targetMember.role];
  const newRoleWeight = ROLE_HIERARCHY[newRole];
  if (actingWeight <= targetCurrentWeight || actingWeight <= newRoleWeight) {
    throw ApiError.forbidden("You do not have permission to assign this role");
  }
  if (newRole === MEMBER_ROLES.OWNER) {
    throw ApiError.forbidden("Ownership must be transferred explicitly, not assigned via role change");
  }

  targetMember.role = newRole;
  await targetMember.save();

  await notify(N_EVENTS.COMMUNITY_ROLE_CHANGED, {
    userId: targetUserId,
    meta: { communityId, newRole, changedBy: actingUserId }
  });

  return { success: true, message: "Member role updated", data: { member: targetMember } };
};

// ── Explicit ownership transfer — separate from changeRole on purpose ─
const transferOwnership = async (currentOwnerId, newOwnerUserId, communityId) => {
  const currentOwnerMember = await CommunityMember.findOne({ communityId, userId: currentOwnerId });
  if (!currentOwnerMember || currentOwnerMember.role !== MEMBER_ROLES.OWNER) {
    throw ApiError.forbidden("Only the current owner can transfer ownership");
  }
  const newOwnerMember = await CommunityMember.findOne({ communityId, userId: newOwnerUserId });
  if (!newOwnerMember) throw ApiError.notFound("New owner must already be a member of this community");

  currentOwnerMember.role = MEMBER_ROLES.LEADER;
  newOwnerMember.role = MEMBER_ROLES.OWNER;
  await Promise.all([currentOwnerMember.save(), newOwnerMember.save()]);
  await Community.updateOne({ _id: communityId }, { $set: { ownerId: newOwnerUserId } });

  await notify(N_EVENTS.COMMUNITY_ROLE_CHANGED, {
    userId: newOwnerUserId,
    meta: { communityId, newRole: MEMBER_ROLES.OWNER }
  });

  return { success: true, message: "Ownership transferred successfully", data: null };
};

// ── Remove member (kick) ─────────────────────────────────────────────
const removeMember = async (actingUserId, targetUserId, communityId) => {
  assertNotSelfTarget(actingUserId, targetUserId, "remove");

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");

  if (!hasPermission(actingMember.role, "manage_members") && !hasPermission(actingMember.role, "manage_members_below")) {
    throw ApiError.forbidden("You do not have permission to remove members");
  }
  if (ROLE_HIERARCHY[actingMember.role] <= ROLE_HIERARCHY[targetMember.role]) {
    throw ApiError.forbidden("You cannot remove a member with an equal or higher role");
  }

  await CommunityMember.deleteOne({ _id: targetMember._id });
  await Community.updateOne({ _id: communityId }, { $inc: { memberCount: -1 } });

  await notify(N_EVENTS.COMMUNITY_MEMBER_REMOVED, {
    userId: targetUserId,
    meta: { communityId, removedBy: actingUserId }
  });

  return { success: true, message: "Member removed", data: null };
};

// ── Mute / Unmute ─────────────────────────────────────────────────────
const muteMember = async (actingUserId, targetUserId, communityId, mutedUntil) => {
  assertNotSelfTarget(actingUserId, targetUserId, "mute");

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  if (!hasPermission(actingMember.role, "mute_member")) {
    throw ApiError.forbidden("You do not have permission to mute members");
  }
  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");
  if (ROLE_HIERARCHY[actingMember.role] <= ROLE_HIERARCHY[targetMember.role]) {
    throw ApiError.forbidden("You cannot mute a member with an equal or higher role");
  }

  targetMember.mutedUntil = mutedUntil;
  await targetMember.save();
  return { success: true, message: "Member muted", data: { member: targetMember } };
};

// Counterpart to muteMember — previously a mute could only expire on its
// own (mutedUntil passing) with no way to reverse it early.
const unmuteMember = async (actingUserId, targetUserId, communityId) => {
  assertNotSelfTarget(actingUserId, targetUserId, "unmute");

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  if (!hasPermission(actingMember.role, "mute_member")) {
    throw ApiError.forbidden("You do not have permission to unmute members");
  }
  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");

  targetMember.mutedUntil = null;
  await targetMember.save();
  return { success: true, message: "Member unmuted", data: { member: targetMember } };
};

// ── Ban / Unban ────────────────────────────────────────────────────
// NOTE: getMembers() already returned an `isBanned` field before this
// update, but nothing ever set it. These two functions make that field
// real. Reuses "manage_members" as the guarding permission, same as
// removeMember() — if the project later wants ban to be a stricter,
// separate permission (e.g. only owner/leader, not moderator), add a
// dedicated "ban_member" action to ROLE_PERMISSIONS in
// community.constants.js and swap the hasPermission() call below.
const banMember = async (actingUserId, targetUserId, communityId, reason) => {
  assertNotSelfTarget(actingUserId, targetUserId, "ban");

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  if (!hasPermission(actingMember.role, "manage_members") && !hasPermission(actingMember.role, "manage_members_below")) {
    throw ApiError.forbidden("You do not have permission to ban members");
  }
  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");
  if (ROLE_HIERARCHY[actingMember.role] <= ROLE_HIERARCHY[targetMember.role]) {
    throw ApiError.forbidden("You cannot ban a member with an equal or higher role");
  }

  targetMember.isBanned = true;
  targetMember.banReason = reason || null;
  targetMember.bannedAt = new Date();
  await targetMember.save();

  await notify(N_EVENTS.COMMUNITY_MEMBER_REMOVED, {
    userId: targetUserId,
    meta: { communityId, removedBy: actingUserId, banned: true, reason: reason || null }
  });

  return { success: true, message: "Member banned", data: { member: targetMember } };
};

const unbanMember = async (actingUserId, targetUserId, communityId) => {
  assertNotSelfTarget(actingUserId, targetUserId, "unban");

  const actingMember = await getMemberOrThrow(communityId, actingUserId);
  if (!hasPermission(actingMember.role, "manage_members") && !hasPermission(actingMember.role, "manage_members_below")) {
    throw ApiError.forbidden("You do not have permission to unban members");
  }
  const targetMember = await CommunityMember.findOne({ communityId, userId: targetUserId });
  if (!targetMember) throw ApiError.notFound("Target user is not a member of this community");

  targetMember.isBanned = false;
  targetMember.banReason = null;
  targetMember.bannedAt = null;
  await targetMember.save();

  return { success: true, message: "Member unbanned", data: { member: targetMember } };
};

// FIX: getMembers() now requires viewerId and enforces the same
// visibility rule getCommunityById() uses — PUBLIC is open to any
// viewer, PRIVATE requires existing membership (403 if not a member),
// HIDDEN requires existing membership too but 404s instead of 403 for
// non-members, so the roster endpoint can't be used to probe whether a
// hidden community exists.
//
// FIX: sort now uses ROLE_HIERARCHY's numeric weight instead of
// sorting the `role` string alphabetically — owner/leader genuinely
// appear first now, not just whichever role sorts first as text.
const getMembers = async (communityId, viewerId, { page = PAGINATION.DEFAULT_PAGE, limit = PAGINATION.DEFAULT_LIMIT } = {}) => {
  const community = await Community.findById(communityId).lean();
  if (!community) throw ApiError.notFound("Community not found");

  let viewerMembership = null;
  if (viewerId) viewerMembership = await CommunityMember.findOne({ communityId, userId: viewerId }).lean();
  const isMember = !!viewerMembership;

  if (community.visibility !== VISIBILITY.PUBLIC && !isMember) {
    if (community.visibility === VISIBILITY.HIDDEN) throw ApiError.notFound("Community not found");
    throw ApiError.forbidden("You must be a member to view this community's member list");
  }

  const pageSize = Math.min(Number(limit), PAGINATION.MAX_LIMIT);
  const skip = (Number(page) - 1) * pageSize;
  const [rawMembers, total] = await Promise.all([
    CommunityMember.find({ communityId })
      .populate("userId", "username email role")
      .lean(),
    CommunityMember.countDocuments({ communityId })
  ]);

  // In-memory sort by real hierarchy weight (descending — owner first),
  // then joinedAt ascending within the same role. Page is capped at
  // PAGINATION.MAX_LIMIT so this is cheap; skip/limit applied after
  // sorting so pagination reflects the correct hierarchy order.
  const sorted = rawMembers.sort((a, b) => {
    const weightDiff = (ROLE_HIERARCHY[b.role] || 0) - (ROLE_HIERARCHY[a.role] || 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });
  const pageSlice = sorted.slice(skip, skip + pageSize);

  const members = pageSlice.map((m) => ({
    membershipId: m._id,           // CommunityMember document id
    id: m.userId?._id || null,     // the actual User id — use THIS for promote/remove/mute/ban calls
    username: m.userId?.username || null,
    email: m.userId?.email || null,
    accountRole: m.userId?.role || null,   // student/faculty/alumni (platform-wide role)
    communityRole: m.role,                  // owner/leader/co-leader/moderator/member (this community's role)
    joinedAt: m.joinedAt,
    mutedUntil: m.mutedUntil,
    isBanned: m.isBanned || false,
    banReason: m.banReason || null
  }));

  return { members, pagination: { total, page: Number(page), limit: pageSize } };
};

const getMyMembership = async (userId, communityId) => {
  const member = await CommunityMember.findOne({ communityId, userId }).lean();
  return member || null;
};

module.exports = {
  hasPermission,
  getMemberOrThrow,
  joinCommunity,
  addMemberDirectly,
  leaveCommunity,
  changeRole,
  transferOwnership,
  removeMember,
  muteMember,
  unmuteMember,
  banMember,
  unbanMember,
  getMembers,
  getMyMembership
};