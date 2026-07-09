import axiosClient from "./axiosClient";

export const feedApi = {
  getFeed: (params) => axiosClient.get("/feed", { params }),
  createPost: (payload) => axiosClient.post("/feed", payload),
  getPostById: (postId) => axiosClient.get(`/feed/posts/${postId}`),
  editPost: (postId, payload) => axiosClient.patch(`/feed/posts/${postId}`, payload),
  deletePost: (postId) => axiosClient.delete(`/feed/posts/${postId}`),
  toggleLike: (postId) => axiosClient.post(`/feed/posts/${postId}/like`),
  reactToPost: (postId, type) => axiosClient.post(`/feed/posts/${postId}/react`, { type }),
  getReactionSummary: (postId) => axiosClient.get(`/feed/posts/${postId}/reactions`),
  getMyReaction: (postId) => axiosClient.get(`/feed/posts/${postId}/my-reaction`),
  togglePin: (postId, pinned = true) => axiosClient.patch(`/feed/posts/${postId}/pin`, { pinned }),
  moderatePost: (postId, payload) => axiosClient.patch(`/feed/posts/${postId}/moderate`, payload),
  getUserPosts: (userId, params) => axiosClient.get(`/feed/users/${userId}/posts`, { params }),

  getComments: (postId, params) => axiosClient.get(`/feed/posts/${postId}/comments`, { params }),
  createComment: (postId, payload) => axiosClient.post(`/feed/posts/${postId}/comments`, payload),
  editComment: (commentId, content) => axiosClient.patch(`/feed/comments/${commentId}`, { content }),
  deleteComment: (commentId) => axiosClient.delete(`/feed/comments/${commentId}`),
  getReplies: (commentId) => axiosClient.get(`/feed/comments/${commentId}/replies`),
  reactToComment: (commentId, type) => axiosClient.post(`/feed/comments/${commentId}/react`, { type }),
  getCommentReactionSummary: (commentId) => axiosClient.get(`/feed/comments/${commentId}/reactions`),
  getMyCommentReaction: (commentId) => axiosClient.get(`/feed/comments/${commentId}/my-reaction`),
  moderateComment: (commentId, payload) => axiosClient.patch(`/feed/comments/${commentId}/moderate`, payload),

  toggleBookmark: (postId) => axiosClient.post(`/feed/posts/${postId}/bookmark`),
  getBookmarks: (params) => axiosClient.get("/feed/bookmarks", { params }),

  createReport: (payload) => axiosClient.post("/feed/reports", payload),
  getReports: (params) => axiosClient.get("/feed/admin/reports", { params }),
  resolveReport: (reportId, payload) => axiosClient.patch(`/feed/admin/reports/${reportId}`, payload)
};
