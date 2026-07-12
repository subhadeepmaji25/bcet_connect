import axiosClient from "../../../api/axiosClient";

export const resourcesApi = {
  list: (params) => axiosClient.get("/learning/resources", { params }),
  mine: (params) => axiosClient.get("/learning/resources/mine", { params }),
  pending: (params) => axiosClient.get("/learning/resources/pending", { params }),
  bookmarks: (params) => axiosClient.get("/learning/resources/bookmarks", { params }),
  continueLearning: (params) => axiosClient.get("/learning/resources/continue-learning", { params }),
  getById: (id) => axiosClient.get(`/learning/resources/${id}`),
  upload: (formData) => axiosClient.post("/learning/resources", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  }),
  verify: ({ id, decision, rejectionReason }) =>
    axiosClient.patch(`/learning/resources/${id}/verify`, { decision, rejectionReason }),
  remove: (id) => axiosClient.delete(`/learning/resources/${id}`)
};
