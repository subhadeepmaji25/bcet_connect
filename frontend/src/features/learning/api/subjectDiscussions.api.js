import axiosClient from "../../../api/axiosClient";

export const subjectDiscussionsApi = {
  getQuestions: (subjectId, params) => axiosClient.get(`/learning/subjects/${subjectId}/discussions`, { params }),
  createQuestion: (subjectId, data) => axiosClient.post(`/learning/subjects/${subjectId}/discussions`, data),
  
  getAnswers: (discussionId, params) => axiosClient.get(`/learning/discussions/${discussionId}/answers`, { params }),
  editDiscussion: (discussionId, data) => axiosClient.patch(`/learning/discussions/${discussionId}`, data),
  deleteDiscussion: (discussionId) => axiosClient.delete(`/learning/discussions/${discussionId}`),
  
  acceptAnswer: (discussionId) => axiosClient.post(`/learning/discussions/${discussionId}/accept`),
  togglePin: (discussionId) => axiosClient.post(`/learning/discussions/${discussionId}/pin`),
  toggleLike: (discussionId) => axiosClient.post(`/learning/discussions/${discussionId}/like`),
};
