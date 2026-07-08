// src/constants/communityPermissions.js
// Synchronized with backend community.constants.js

export const ROLE_PERMISSIONS = {
  owner: ["*"],
  leader: ["manage_members", "manage_feed", "manage_chat", "promote_moderator", "approve_join_request", "edit_community"],
  "co-leader": ["manage_members_below", "manage_feed", "approve_join_request"],
  moderator: ["delete_post", "delete_comment", "pin_post", "mute_member", "warn_member"],
  member: ["read", "write"]
};

export const hasPermission = (role, action) => {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(action);
};
