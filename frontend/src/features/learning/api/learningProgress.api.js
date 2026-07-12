import axiosClient from "../../../api/axiosClient";

export const learningProgressApi = {
  markOpened: (resourceId) => axiosClient.post(`/learning/resources/${resourceId}/progress/open`),
  updateProgress: (resourceId, data) => axiosClient.patch(`/learning/resources/${resourceId}/progress`, data),
  getMyProgress: (resourceId) => axiosClient.get(`/learning/resources/${resourceId}/progress/mine`),
  getStats: (resourceId) => axiosClient.get(`/learning/resources/${resourceId}/progress/stats`),
};
