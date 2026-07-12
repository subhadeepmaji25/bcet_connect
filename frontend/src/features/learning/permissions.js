/**
 * Resolves frontend uploader permission matching backend's resolveUploaderRole logic.
 * isCR comes from Profile.isCR, which should be included in the user session object.
 */

export const canUploadResource = (user) => {
  if (!user) return false;
  return (
    user.role === "faculty" || 
    user.role === "admin" || 
    (user.role === "student" && user.isCR === true)
  );
};

export const canVerifyResource = (user) => {
  if (!user) return false;
  return user.role === "faculty" || user.role === "admin";
};

export const canManageSubject = (user) => {
  if (!user) return false;
  return user.role === "faculty" || user.role === "admin";
};

export const canCreateLearningPath = (user) => {
  if (!user) return false;
  return user.role === "faculty" || user.role === "admin";
};

export const canPinQuestion = (user) => {
  if (!user) return false;
  return user.role === "faculty" || user.role === "admin";
};

export const isFacultyOrAdmin = (user) => {
  if (!user) return false;
  return user.role === "faculty" || user.role === "admin";
};

// Everyone authenticated can enroll in paths, ask/answer questions, and track progress
export const canEnrollInPath = (user) => !!user;
export const canAskQuestion = (user) => !!user;
