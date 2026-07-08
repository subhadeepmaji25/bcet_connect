// src/api/jobs.api.js
import axiosClient from "./axiosClient";

// ── Job Listings ──────────────────────────────────────────────────────────
export const getApprovedJobs       = (params)         => axiosClient.get("/jobs", { params });
export const getJobById            = (jobId)           => axiosClient.get(`/jobs/${jobId}`);
export const getMyJobs             = (params)          => axiosClient.get("/jobs/poster/my", { params });
export const getPendingJobs        = (params)          => axiosClient.get("/jobs/admin/pending", { params });

// ── Job CRUD ──────────────────────────────────────────────────────────────
export const createJob             = (data)            => axiosClient.post("/jobs", data);
export const updateJob             = (jobId, data)     => axiosClient.patch(`/jobs/${jobId}`, data);
export const deleteJob             = (jobId)           => axiosClient.delete(`/jobs/${jobId}`);

// ── Job Status Actions ────────────────────────────────────────────────────
export const approveJob            = (jobId)           => axiosClient.patch(`/jobs/${jobId}/approve`);
export const rejectJob             = (jobId, data)     => axiosClient.patch(`/jobs/${jobId}/reject`, data);
export const closeJob              = (jobId, data)     => axiosClient.patch(`/jobs/${jobId}/close`, data);
export const reopenJob             = (jobId, data = {}) => axiosClient.patch(`/jobs/${jobId}/reopen`, data);
export const archiveJob            = (jobId)           => axiosClient.patch(`/jobs/${jobId}/archive`);
export const featureJob            = (jobId, data)     => axiosClient.patch(`/jobs/${jobId}/feature`, data);
export const verifyCompany         = (jobId)           => axiosClient.patch(`/jobs/${jobId}/verify-company`);
export const getJobAnalytics       = (jobId)           => axiosClient.get(`/jobs/${jobId}/analytics`);

// ── Applications ──────────────────────────────────────────────────────────
export const applyForJob           = (jobId, data)     => axiosClient.post(`/jobs/${jobId}/apply`, data);
export const getMyApplications     = (params)          => axiosClient.get("/jobs/applications/my", { params });
export const getJobApplications    = (jobId, params)   => axiosClient.get(`/jobs/${jobId}/applications`, { params });
export const withdrawApplication   = (applicationId)   => axiosClient.patch(`/jobs/applications/${applicationId}/withdraw`);
export const updateApplicationStatus = (applicationId, data) => axiosClient.patch(`/jobs/applications/${applicationId}/status`, data);
