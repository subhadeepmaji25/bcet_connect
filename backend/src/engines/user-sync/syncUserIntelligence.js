// backend/src/engines/user-sync/syncUserIntelligence.js
//
// NEW: after calculateCompletion() runs, check its `justCompleted` flag
// and fire PROFILE_COMPLETED exactly once, right here — the single place
// every user-service (skill/education/experience/project/resume/profile)
// already routes through. notify() never throws (see notification.listener.js),
// so this can't break the sync pipeline even if notification creation fails.

const { calculateCompletion } = require("../profile-completion/calculateCompletion");
const { buildSearchProfile } = require("../search-profile/buildSearchProfile");
const { notify } = require("../../modules/notification/listeners/notification.listener");
const { NOTIFICATION_EVENTS } = require("../../modules/notification/constants/notification.constants");
const logger = require("../../shared/logger/logger");

const syncUserIntelligence = async (userId) => {
  if (!userId) {
    throw new Error("userId is required to sync user intelligence");
  }

  let completionResult = {
    totalCompletion: 0,
    recommendationEnabled: false,
    profileScore: 0,
    skillScore: 0,
    educationScore: 0,
    projectScore: 0,
    resumeScore: 0,
    justCompleted: false
  };

  try {
    completionResult = await calculateCompletion(userId);
  } catch (error) {
    logger.error(`calculateCompletion failed for userId=${userId}`, error);
  }

  let searchProfile = null;
  try {
    searchProfile = await buildSearchProfile(userId);
  } catch (error) {
    logger.error(`buildSearchProfile failed for userId=${userId}`, error);
  }

  // NEW: fire PROFILE_COMPLETED only on the transition to 100%. Placed
  // after both engines run (not inside calculateCompletion itself) so a
  // failure in notify() can never affect completion/search-profile state.
  if (completionResult.justCompleted) {
    await notify(NOTIFICATION_EVENTS.PROFILE_COMPLETED, {
      userId,
      data: {},
      meta: {}
    });
  }

  return {
    totalCompletion: completionResult.totalCompletion,
    recommendationEnabled: completionResult.recommendationEnabled,
    breakdown: {
      profileScore: completionResult.profileScore,
      skillScore: completionResult.skillScore,
      educationScore: completionResult.educationScore,
      projectScore: completionResult.projectScore,
      resumeScore: completionResult.resumeScore
    },
    searchProfile
  };
};

module.exports = { syncUserIntelligence };