import axiosClient from "../../../api/axiosClient";

export const resourceEngagementApi = {
  bookmark: (resourceId) => axiosClient.post(`/learning/resources/${resourceId}/bookmark`),
  rate: (resourceId, rating) => axiosClient.post(`/learning/resources/${resourceId}/rate`, { rating }),
  getMyRating: (resourceId) => axiosClient.get(`/learning/resources/${resourceId}/rating/mine`),
  getRatings: (resourceId, params) => axiosClient.get(`/learning/resources/${resourceId}/ratings`, { params }),
  download: (resourceId) => axiosClient.post(`/learning/resources/${resourceId}/download`),
  
  // Comments
  getComments: (resourceId, params) => axiosClient.get(`/learning/resources/${resourceId}/comments`, { params }),
  createComment: (resourceId, data) => axiosClient.post(`/learning/resources/${resourceId}/comments`, data),
  getReplies: (commentId, params) => axiosClient.get(`/learning/comments/${commentId}/replies`, { params }),
  editComment: (commentId, content) => axiosClient.patch(`/learning/comments/${commentId}`, { content }),
  deleteComment: (commentId) => axiosClient.delete(`/learning/comments/${commentId}`),
  likeComment: (commentId) => axiosClient.post(`/learning/comments/${commentId}/like`),
};
