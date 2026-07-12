// backend/src/modules/mentorship/services/mentorProfile.service.js
const MentorProfile = require("../models/MentorProfile");
const Profile = require("../../users/models/Profile");
const SearchProfile = require("../../search/models/SearchProfile");
const connectionService = require("../../connections/services/connection.service");
const ApiError = require("../../../shared/errors/ApiError");
const { syncUserIntelligence } = require("../../../engines/user-sync/syncUserIntelligence");
const searchService = require("../../search/services/search.service");
const mentorRequestService = require("./mentorRequest.service");
const {
  MENTOR_ELIGIBLE_ROLES,
  MENTOR_STATUS,
  VERIFICATION_STATUS,
  PROFILE_VISIBILITY // NEW
} = require("../constants/mentor.constants");

// NOTE: "profileVisibility" ab ALLOWED_UPDATE_FIELDS me nahi hai —
// isko alag dedicated endpoint (updateProfileVisibility) se hi change karwate hain,
// taaki accidental PATCH /profile body me chhup kar visibility na badal jaye.
const ALLOWED_UPDATE_FIELDS = [
  "bio", "domains", "languages", "yearsExperience", "company", "designation", "availability"
];

const mentorProfilePublicFields =
  "userId mentorRole bio domains languages yearsExperience company designation availability profileVisibility mentorStatus verificationStatus rating reviewCount totalSessions createdAt updatedAt";

const toIdString = (value) => {
  if (!value) return "";
  if (value._id) return value._id.toString();
  return value.toString();
};

const profileUserId = (mentorProfile) => toIdString(mentorProfile.userId);

const buildMentorCard = ({ searchProfile = null, mentorProfile }) => {
  const populatedUser = mentorProfile?.userId && typeof mentorProfile.userId === "object" ? mentorProfile.userId : null;
  const userId = searchProfile?.userId || populatedUser?._id || mentorProfile?.userId;

  return {
    userId,
    username: searchProfile?.username || populatedUser?.username || "",
    fullName: searchProfile?.fullName || "",
    role: searchProfile?.role || populatedUser?.role || mentorProfile?.mentorRole || "",
    avatar: searchProfile?.avatar || "",
    headline: searchProfile?.headline || "",
    branch: searchProfile?.branch || "",
    department: searchProfile?.department || "",
    currentCompany: searchProfile?.currentCompany || mentorProfile?.company || "",
    currentRole: searchProfile?.currentRole || mentorProfile?.designation || "",
    location: searchProfile?.location || "",
    passoutYear: searchProfile?.passoutYear ?? null,
    mergedSkills: searchProfile?.mergedSkills || [],
    verifiedSkills: searchProfile?.verifiedSkills || [],
    profileCompletion: searchProfile?.profileCompletion ?? 0,
    searchScore: searchProfile?.searchScore ?? 0,
    connectionStatus: searchProfile?.connectionStatus || "none",
    mentorProfile: {
      mentorRole: mentorProfile?.mentorRole || "",
      bio: mentorProfile?.bio || "",
      domains: mentorProfile?.domains || [],
      languages: mentorProfile?.languages || [],
      yearsExperience: mentorProfile?.yearsExperience ?? 0,
      company: mentorProfile?.company || "",
      designation: mentorProfile?.designation || "",
      availability: mentorProfile?.availability || [],
      profileVisibility: mentorProfile?.profileVisibility || PROFILE_VISIBILITY.PUBLIC,
      mentorStatus: mentorProfile?.mentorStatus || MENTOR_STATUS.ACTIVE,
      verificationStatus: mentorProfile?.verificationStatus || VERIFICATION_STATUS.PENDING,
      rating: mentorProfile?.rating ?? 0,
      reviewCount: mentorProfile?.reviewCount ?? 0,
      totalSessions: mentorProfile?.totalSessions ?? 0
    }
  };
};

const attachMentorProfilesToSearchResults = async (searchResult, query = {}) => {
  const users = searchResult.users || [];
  if (users.length === 0) return { mentors: [], pagination: searchResult.pagination };

  const filter = {
    userId: { $in: users.map((user) => user.userId).filter(Boolean) },
    mentorStatus: MENTOR_STATUS.ACTIVE,
    profileVisibility: PROFILE_VISIBILITY.PUBLIC
  };

  const isVerifiedParam = String(query.isVerified).toLowerCase();
  if (isVerifiedParam === "true") {
    filter.verificationStatus = VERIFICATION_STATUS.VERIFIED;
  } else if (isVerifiedParam === "false") {
    filter.verificationStatus = VERIFICATION_STATUS.PENDING;
  }
  // If query.isVerified is not specified, we don't strictly filter by VERIFIED, 
  // letting all ACTIVE & PUBLIC mentors appear (or however the domain specifies).

  const mentorProfiles = await MentorProfile.find(filter)
    .select(mentorProfilePublicFields)
    .lean();

  const mentorProfileMap = new Map(mentorProfiles.map((mentorProfile) => [profileUserId(mentorProfile), mentorProfile]));
  const mentors = users
    .map((searchProfile) => {
      const mentorProfile = mentorProfileMap.get(toIdString(searchProfile.userId));
      if (!mentorProfile) return null;
      return buildMentorCard({ searchProfile, mentorProfile });
    })
    .filter(Boolean);

  return { mentors, pagination: searchResult.pagination };
};

const buildMentorCardsFromProfiles = async (mentorProfiles, viewerId = null) => {
  if (mentorProfiles.length === 0) return [];

  const userIds = mentorProfiles.map((mentorProfile) => mentorProfile.userId).filter(Boolean);
  const searchProfiles = await SearchProfile.find({ userId: { $in: userIds } }).lean();
  const searchProfileMap = new Map(searchProfiles.map((profile) => [toIdString(profile.userId), profile]));

  const cards = mentorProfiles.map((mentorProfile) =>
    buildMentorCard({
      searchProfile: searchProfileMap.get(profileUserId(mentorProfile)) || null,
      mentorProfile
    })
  );

  if (!viewerId) return cards;

  const statusMap = await connectionService.getConnectionStatusesForViewer(viewerId, userIds);
  return cards.map((card) => ({
    ...card,
    connectionStatus: card.userId ? statusMap.get(card.userId.toString()) || "none" : "none"
  }));
};

const syncMentorFlag = async (userId, isMentor) => {
  await Profile.updateOne({ userId }, { $set: { isMentor } });
  await syncUserIntelligence(userId);
};

const becomeMentor = async (userId, userRole, payload) => {
  if (!MENTOR_ELIGIBLE_ROLES.includes(userRole)) {
    throw ApiError.forbidden("Only faculty or alumni can become a mentor");
  }
  const existing = await MentorProfile.findOne({ userId });
  if (existing) {
    throw ApiError.conflict("You already have a mentor profile");
  }
  const mentorProfile = await MentorProfile.create({ userId, mentorRole: userRole, ...payload });
  await syncMentorFlag(userId, true);
  return { success: true, message: "Mentor profile created successfully", data: { mentorProfile } };
};

const getMyMentorProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ userId });
  if (!mentorProfile) throw ApiError.notFound("You don't have a mentor profile yet");
  return { success: true, message: "Mentor profile fetched", data: { mentorProfile } };
};

const updateMentorProfile = async (userId, payload) => {
  const mentorProfile = await MentorProfile.findOne({ userId });
  if (!mentorProfile) throw ApiError.notFound("You don't have a mentor profile yet");
  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (payload[field] !== undefined) mentorProfile[field] = payload[field];
  });
  await mentorProfile.save();
  return { success: true, message: "Mentor profile updated", data: { mentorProfile } };
};

// NEW — dedicated visibility toggle
const updateProfileVisibility = async (userId, visibility) => {
  if (!Object.values(PROFILE_VISIBILITY).includes(visibility)) {
    throw ApiError.badRequest("visibility must be 'public' or 'private'");
  }
  const mentorProfile = await MentorProfile.findOne({ userId });
  if (!mentorProfile) throw ApiError.notFound("You don't have a mentor profile yet");
  mentorProfile.profileVisibility = visibility;
  await mentorProfile.save();
  return {
    success: true,
    message: `Mentor profile is now ${visibility}`,
    data: { mentorProfile }
  };
};

const deactivateMentorProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ userId });
  if (!mentorProfile) throw ApiError.notFound("You don't have a mentor profile yet");
  mentorProfile.mentorStatus = MENTOR_STATUS.INACTIVE;
  await mentorProfile.save();
  await syncMentorFlag(userId, false);
  return { success: true, message: "Mentor profile deactivated", data: null };
};

const reactivateMentorProfile = async (userId) => {
  const mentorProfile = await MentorProfile.findOne({ userId });
  if (!mentorProfile) throw ApiError.notFound("You don't have a mentor profile yet");

  if (mentorProfile.mentorStatus === MENTOR_STATUS.SUSPENDED) {
    throw ApiError.forbidden("Your mentor profile was suspended by an admin and cannot be self-reactivated");
  }
  if (mentorProfile.mentorStatus === MENTOR_STATUS.ACTIVE) {
    throw ApiError.conflict("Your mentor profile is already active");
  }

  mentorProfile.mentorStatus = MENTOR_STATUS.ACTIVE;
  await mentorProfile.save();
  await syncMentorFlag(userId, true);
  return { success: true, message: "Mentor profile reactivated successfully", data: { mentorProfile } };
};
const getPublicMentorProfile = async (mentorUserId, viewerId = null) => {
  const mentorProfile = await MentorProfile.findOne({
    userId: mentorUserId,
    mentorStatus: { $ne: MENTOR_STATUS.SUSPENDED }
  }).populate("userId", "username email role");
  if (!mentorProfile) throw ApiError.notFound("Mentor not found");

  const profile = await Profile.findOne({ userId: mentorUserId });
  const isSelf = viewerId && viewerId.toString() === mentorUserId.toString();
  if (mentorProfile.profileVisibility === PROFILE_VISIBILITY.PRIVATE && !isSelf) {
    throw ApiError.forbidden("This mentor has set their mentorship profile to private");
  }

  let requestStatus = null;
  if (viewerId && !isSelf) {
    requestStatus = await mentorRequestService.getRequestStatus(viewerId, mentorUserId);
  }

  return {
    success: true,
    message: "Mentor profile fetched",
    data: {
      mentorProfile,
      publicProfile: profile || null, // FIX: ab bheja ja raha hai
      requestStatus
    }
  };
};

const verifyMentor = async (idOrUserId, adminId) => {
  const mentorProfile = await MentorProfile.findOne({
    $or: [{ _id: idOrUserId }, { userId: idOrUserId }]
  });
  if (!mentorProfile) throw ApiError.notFound("Mentor not found");
  mentorProfile.verificationStatus = VERIFICATION_STATUS.VERIFIED;
  mentorProfile.verifiedBy = adminId;
  mentorProfile.verifiedAt = new Date();
  await mentorProfile.save();
  return { success: true, message: "Mentor verified successfully", data: { mentorProfile } };
};

const rejectMentor = async (idOrUserId, adminId, reason = "") => {
  const mentorProfile = await MentorProfile.findOne({
    $or: [{ _id: idOrUserId }, { userId: idOrUserId }]
  });
  if (!mentorProfile) throw ApiError.notFound("Mentor not found");
  mentorProfile.verificationStatus = VERIFICATION_STATUS.REJECTED;
  // Use metadata or another field to store rejection reason if needed, 
  // but for now just updating the status is sufficient to remove from pending.
  await mentorProfile.save();
  return { success: true, message: "Mentor rejected successfully", data: { mentorProfile } };
};

// FIXED — private mentors ab listing me nahi aayenge (searchService ko flag pass kiya)
const listMentors = async (query, viewerId = null) => {
  let allowedUserIds = null;
  const isVerifiedParam = String(query.isVerified).toLowerCase();

  // If domain or isVerified is provided, pre-filter MentorProfiles
  if (query.domain || isVerifiedParam === "true" || isVerifiedParam === "false") {
    const filter = {
      mentorStatus: MENTOR_STATUS.ACTIVE,
      profileVisibility: PROFILE_VISIBILITY.PUBLIC
    };
    if (query.domain) filter.domains = query.domain;
    if (isVerifiedParam === "true") filter.verificationStatus = VERIFICATION_STATUS.VERIFIED;
    if (isVerifiedParam === "false") filter.verificationStatus = VERIFICATION_STATUS.PENDING;

    const profiles = await MentorProfile.find(filter).select("userId").lean();
    allowedUserIds = profiles.map((p) => p.userId);

    if (allowedUserIds.length === 0) {
      return { mentors: [], pagination: { total: 0, page: 1, limit: query.limit || 10, totalPages: 0 } };
    }
  }

  const searchResult = await searchService.searchUsers(
    { ...query, isMentor: true, mentorProfileVisibility: PROFILE_VISIBILITY.PUBLIC, allowedUserIds },
    viewerId
  );

  return attachMentorProfilesToSearchResults(searchResult, query);
};

const getTopMentors = async ({ limit = 10 } = {}, viewerId = null) => {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const mentorProfiles = await MentorProfile.find({
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    mentorStatus: MENTOR_STATUS.ACTIVE,
    profileVisibility: PROFILE_VISIBILITY.PUBLIC
  })
    .select(mentorProfilePublicFields)
    .sort({ rating: -1, reviewCount: -1, totalSessions: -1, createdAt: -1 })
    .limit(normalizedLimit)
    .populate("userId", "username email role")
    .lean();

  return buildMentorCardsFromProfiles(mentorProfiles, viewerId);
};

// FIXED — profileVisibility: PUBLIC filter add kiya, warna private mentor bhi list me dikh jaata
const getVerifiedMentors = async ({ page = 1, limit = 10 } = {}) => {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = {
    verificationStatus: VERIFICATION_STATUS.VERIFIED,
    mentorStatus: MENTOR_STATUS.ACTIVE,
    profileVisibility: PROFILE_VISIBILITY.PUBLIC
  };
  const [mentors, total] = await Promise.all([
    MentorProfile.find(filter)
      .select(mentorProfilePublicFields)
      .sort({ rating: -1, reviewCount: -1, totalSessions: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("userId", "username email role")
      .lean(),
    MentorProfile.countDocuments(filter)
  ]);

  const mentorCards = await buildMentorCardsFromProfiles(mentors);

  return {
    mentors: mentorCards,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
  };
};

module.exports = {
  becomeMentor,
  getMyMentorProfile,
  updateMentorProfile,
  updateProfileVisibility, // NEW export
  deactivateMentorProfile,
  reactivateMentorProfile,
  getPublicMentorProfile,
  verifyMentor,
  rejectMentor,
  listMentors,
  getTopMentors,
  getVerifiedMentors
};
