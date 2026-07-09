/**
 * Normalizes user/profile objects from various backend responses into a consistent frontend shape.
 * Backend often returns `Profile` nested under `User` or vice versa, or `SearchProfile` / `MentorProfile` shapes.
 * 
 * @param {Object} data - The raw user/profile/mentor object from backend
 * @returns {Object} - Normalized object with guaranteed fields
 */
export const normalizeUser = (data) => {
  if (!data) return null;

  const isObject = (val) => val && typeof val === 'object' && !Array.isArray(val);
  
  const userObj = (isObject(data.user) ? data.user : (isObject(data.userId) ? data.userId : null)) || (data.email ? data : null) || {};
  const profileObj = (isObject(data.profile) ? data.profile : (isObject(data.profileId) ? data.profileId : null)) || (data.fullName ? data : null) || {};
  const mentorObj = isObject(data.mentorProfile) ? data.mentorProfile : {};
  
  return {
    ...data, // keep original fields
    _id: data._id || userObj._id || profileObj._id,
    userId: userObj._id || data.userId || data._id,
    
    // Identity
    username: userObj.username || profileObj.username || data.username || '',
    email: userObj.email || data.email || '',
    role: userObj.role || data.role || 'student',
    accountStatus: userObj.accountStatus || data.accountStatus || 'active',
    profileCreated: userObj.profileCreated !== undefined ? userObj.profileCreated : (data.profileCreated !== undefined ? data.profileCreated : false),
    
    // Profile specific
    fullName: profileObj.fullName || data.fullName || userObj.fullName || userObj.username || data.username || 'Unknown',
    avatar: profileObj.avatar || data.avatar || userObj.avatar || '',
    bio: profileObj.bio || data.bio || '',
    headline: profileObj.headline || data.headline || '',
    
    // Mentorship specific
    isMentor: data.isMentor || profileObj.isMentor || Boolean(data.mentorProfile),
    mentorProfile: mentorObj,
    verificationStatus: mentorObj.verificationStatus || data.verificationStatus || (data.isVerified ? 'verified' : 'unverified'),
    isVerified: mentorObj.verificationStatus === 'verified' || data.verificationStatus === 'verified' || data.isVerified === true,
    rating: mentorObj.rating ?? data.rating ?? data.averageRating ?? 0,
    reviewCount: mentorObj.reviewCount ?? data.reviewCount ?? data.totalRatings ?? 0,
    totalSessions: mentorObj.totalSessions ?? data.totalSessions ?? 0,
    
    // Extracted aggregates
    searchScore: data.searchScore ?? 0,
    profileCompletion: data.profileCompletion ?? profileObj.profileCompletion ?? 0,
    totalProjects: data.totalProjects ?? data.totalPublicProjects ?? 0,
    totalExperiences: data.totalExperiences ?? 0,
    
    // Skills (merge SearchProfile and standard Profile shapes)
    skills: Array.isArray(data.mergedSkills) ? data.mergedSkills : 
            Array.isArray(data.skills) ? data.skills : 
            Array.isArray(profileObj.skills) ? profileObj.skills : [],
    domains: Array.isArray(mentorObj.domains) ? mentorObj.domains : 
             Array.isArray(data.domains) ? data.domains : 
             Array.isArray(profileObj.domains) ? profileObj.domains : [],
  };
};

/**
 * Normalizes message participants
 */
export const normalizeParticipant = (participant) => {
  return normalizeUser(participant);
};
