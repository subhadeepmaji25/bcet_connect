import axiosClient from "../../../api/axiosClient";

export const learningPathsApi = {
  list: (params) => axiosClient.get("/learning/paths", { params }),
  mine: (params) => axiosClient.get("/learning/paths/mine", { params }),
  getById: (id) => axiosClient.get(`/learning/paths/${id}`),
  create: (data) => axiosClient.post("/learning/paths", data),
  update: (id, data) => axiosClient.patch(`/learning/paths/${id}`, data),
  publish: (id) => axiosClient.post(`/learning/paths/${id}/publish`),
  remove: (id) => axiosClient.delete(`/learning/paths/${id}`),
  
  // Progress & Enrollment
  enroll: (id) => axiosClient.post(`/learning/paths/${id}/enroll`),
  updateStepProgress: (pathId, stepId, data) => axiosClient.patch(`/learning/paths/${pathId}/steps/${stepId}/progress`, data),
  getMyProgress: (id) => axiosClient.get(`/learning/paths/${id}/progress/mine`),
};
