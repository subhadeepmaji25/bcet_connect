import axiosClient from "./axiosClient";

export const feedApi = {
  getFeed: (params) => axiosClient.get("/feed", { params }),
  createPost: (payload) => axiosClient.post("/feed", payload),
  getPostById: (postId) => axiosClient.get(`/feed/posts/${postId}`),
  editPost: (postId, payload) => axiosClient.patch(`/feed/posts/${postId}`, payload),
  deletePost: (postId) => axiosClient.delete(`/feed/posts/${postId}`),
  toggleLike: (postId) => axiosClient.post(`/feed/posts/${postId}/like`),
  getUserPosts: (userId, params) => axiosClient.get(`/feed/users/${userId}/posts`, { params }),
  getComments: (postId, params) => axiosClient.get(`/feed/posts/${postId}/comments`, { params }),
  createComment: (postId, payload) => axiosClient.post(`/feed/posts/${postId}/comments`, payload),
  editComment: (commentId, content) => axiosClient.patch(`/feed/comments/${commentId}`, { content }),
  deleteComment: (commentId) => axiosClient.delete(`/feed/comments/${commentId}`),
  getReplies: (commentId) => axiosClient.get(`/feed/comments/${commentId}/replies`),
};
