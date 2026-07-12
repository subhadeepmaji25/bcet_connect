import axiosClient from "../../../api/axiosClient";

export const learningAnalyticsApi = {
  getMyStats: () => axiosClient.get("/learning/analytics/mine"),
  getFacultyOverview: () => axiosClient.get("/learning/analytics/faculty-overview"),
  getSubjectAnalytics: (subjectId) => axiosClient.get(`/learning/subjects/${subjectId}/analytics`),
};
