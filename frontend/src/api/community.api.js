// src/api/community.api.js
import axiosClient from "./axiosClient";

// ── Discovery ─────────────────────────────────────────────────────────────
export const listPublicCommunities = (params) => axiosClient.get("/communities", { params });
export const searchCommunities = (params) => axiosClient.get("/communities/search", { params });

// ── Community CRUD ────────────────────────────────────────────────────────
export const createCommunity = (data) => axiosClient.post("/communities", data);
export const getCommunityById = (communityId) => axiosClient.get(`/communities/${communityId}`);
export const updateCommunity = (communityId, data) => axiosClient.patch(`/communities/${communityId}`, data);
export const archiveCommunity = (communityId) => axiosClient.delete(`/communities/${communityId}`);

// ── Membership ────────────────────────────────────────────────────────────
export const joinCommunity = (communityId) => axiosClient.post(`/communities/${communityId}/join`);
export const leaveCommunity = (communityId) => axiosClient.delete(`/communities/${communityId}/leave`);
export const getMembers = (communityId, params) => axiosClient.get(`/communities/${communityId}/members`, { params });
export const getMyMembership = (communityId) => axiosClient.get(`/communities/${communityId}/members/me`);
export const changeMemberRole = (communityId, userId, data) => axiosClient.patch(`/communities/${communityId}/members/${userId}/role`, data);
export const transferOwnership = (communityId, data) => axiosClient.patch(`/communities/${communityId}/transfer-ownership`, data);
export const removeMember = (communityId, userId) => axiosClient.delete(`/communities/${communityId}/members/${userId}`);
export const muteMember = (communityId, userId, data) => axiosClient.patch(`/communities/${communityId}/members/${userId}/mute`, data);
export const unmuteMember = (communityId, userId) => axiosClient.patch(`/communities/${communityId}/members/${userId}/unmute`);
export const banMember = (communityId, userId, data) => axiosClient.patch(`/communities/${communityId}/members/${userId}/ban`, data);
export const unbanMember = (communityId, userId) => axiosClient.patch(`/communities/${communityId}/members/${userId}/unban`);

// ── Join Requests (private communities) ──────────────────────────────────
export const createJoinRequest = (communityId, data) => axiosClient.post(`/communities/${communityId}/join-requests`, data);
export const getPendingJoinRequests = (communityId) => axiosClient.get(`/communities/${communityId}/join-requests`);
export const approveJoinRequest = (requestId) => axiosClient.patch(`/communities/join-requests/${requestId}/approve`);
export const rejectJoinRequest = (requestId, data) => axiosClient.patch(`/communities/join-requests/${requestId}/reject`, data);

// ── Feed (Posts) ──────────────────────────────────────────────────────────
export const getFeed = (communityId, params) => axiosClient.get(`/communities/${communityId}/feed`, { params });
export const createPost = (communityId, data) => axiosClient.post(`/communities/${communityId}/posts`, data);
export const getPostById = (postId) => axiosClient.get(`/communities/posts/${postId}`);
export const editPost = (postId, data) => axiosClient.patch(`/communities/posts/${postId}`, data);
export const deletePost = (postId) => axiosClient.delete(`/communities/posts/${postId}`);
export const pinPost = (postId, data) => axiosClient.patch(`/communities/posts/${postId}/pin`, data);
export const likePost = (postId) => axiosClient.post(`/communities/posts/${postId}/like`);

// ── Comments ──────────────────────────────────────────────────────────────
export const getComments = (postId, params) => axiosClient.get(`/communities/posts/${postId}/comments`, { params });
export const createComment = (postId, data) => axiosClient.post(`/communities/posts/${postId}/comments`, data);
export const editComment = (commentId, data) => axiosClient.patch(`/communities/comments/${commentId}`, data);
export const deleteComment = (commentId) => axiosClient.delete(`/communities/comments/${commentId}`);
export const getCommentReplies = (commentId) => axiosClient.get(`/communities/comments/${commentId}/replies`);
