// src/api/users.api.js
import axiosClient from "./axiosClient";

// ── Profile ───────────────────────────────────────────────────────────────
export const getMyProfile        = ()              => axiosClient.get("/users/profile");
export const updateProfile       = (data)          => axiosClient.patch("/users/profile", data);
export const updateLastActive    = ()              => axiosClient.patch("/users/profile/activity");
export const getPublicProfile    = (userId)        => axiosClient.get(`/users/profile/public/${userId}`);
export const uploadAvatar        = (formData)      => axiosClient.post("/users/profile/avatar", formData);
export const deleteAvatar        = ()              => axiosClient.delete("/users/profile/avatar");

// ── Skills ────────────────────────────────────────────────────────────────
export const addSkill            = (data)          => axiosClient.post("/users/skills", data);
export const bulkAddSkills       = (data)          => axiosClient.post("/users/skills/bulk", data);
export const getSkills           = ()              => axiosClient.get("/users/skills");
export const getSkillById        = (skillId)       => axiosClient.get(`/users/skills/${skillId}`);
export const updateSkill         = (skillId, data) => axiosClient.patch(`/users/skills/${skillId}`, data);
export const deleteSkill         = (skillId)       => axiosClient.delete(`/users/skills/${skillId}`);

// ── Education ─────────────────────────────────────────────────────────────
export const addEducation        = (data)          => axiosClient.post("/users/educations", data);
export const getEducations       = ()              => axiosClient.get("/users/educations");
export const getEducationById    = (id)            => axiosClient.get(`/users/educations/${id}`);
export const updateEducation     = (id, data)      => axiosClient.patch(`/users/educations/${id}`, data);
export const deleteEducation     = (id)            => axiosClient.delete(`/users/educations/${id}`);

// ── Experience ────────────────────────────────────────────────────────────
export const addExperience       = (data)          => axiosClient.post("/users/experiences", data);
export const getExperiences      = ()              => axiosClient.get("/users/experiences");
export const getExperienceById   = (id)            => axiosClient.get(`/users/experiences/${id}`);
export const updateExperience    = (id, data)      => axiosClient.patch(`/users/experiences/${id}`, data);
export const deleteExperience    = (id)            => axiosClient.delete(`/users/experiences/${id}`);

// ── Projects ──────────────────────────────────────────────────────────────
export const addProject          = (data)          => axiosClient.post("/users/projects", data);
export const getProjects         = ()              => axiosClient.get("/users/projects");
export const getPublicProjects   = (userId)        => axiosClient.get(`/users/projects/public/${userId}`);
export const getProjectById      = (id)            => axiosClient.get(`/users/projects/${id}`);
export const updateProject       = (id, data)      => axiosClient.patch(`/users/projects/${id}`, data);
export const deleteProject       = (id)            => axiosClient.delete(`/users/projects/${id}`);

// ── Resumes ───────────────────────────────────────────────────────────────
export const uploadResume        = (formData)      => axiosClient.post("/users/resumes", formData);
export const replaceResume       = (id, formData)  => axiosClient.put(`/users/resumes/${id}`, formData);
export const getResumes          = ()              => axiosClient.get("/users/resumes");
export const getDefaultResume    = ()              => axiosClient.get("/users/resumes/default");
export const updateResumeMeta    = (id, data)      => axiosClient.patch(`/users/resumes/${id}`, data);
export const deleteResume        = (id)            => axiosClient.delete(`/users/resumes/${id}`);
