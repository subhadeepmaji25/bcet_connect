// src/api/recommendation.api.js
import axiosClient from "./axiosClient";

export const getRecommendedJobs = (params) => axiosClient.get("/recommendation/jobs", { params });
export const getJobMatch        = (jobId)  => axiosClient.get(`/recommendation/jobs/${jobId}`);
