import axiosClient from "../../../api/axiosClient";

export const subjectsApi = {
  list: (params) => axiosClient.get("/learning/subjects", { params }),
  mine: () => axiosClient.get("/learning/subjects/mine"),
  getById: (id) => axiosClient.get(`/learning/subjects/${id}`),
  create: (data) => axiosClient.post("/learning/subjects", data),
  update: (id, data) => axiosClient.patch(`/learning/subjects/${id}`, data),
  remove: (id) => axiosClient.delete(`/learning/subjects/${id}`),
};
