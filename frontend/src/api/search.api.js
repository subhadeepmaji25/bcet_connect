// src/api/search.api.js
import axiosClient from "./axiosClient";

export const searchUsers          = (params)    => axiosClient.get("/search/users", { params });
export const searchBySkill        = (skill, params) => axiosClient.get(`/search/skills/${encodeURIComponent(skill)}`, { params });
export const searchByBranch       = (branch, params) => axiosClient.get(`/search/branches/${encodeURIComponent(branch)}`, { params });
export const searchByRole         = (role, params)   => axiosClient.get(`/search/roles/${encodeURIComponent(role)}`, { params });
export const searchByCompany      = (company, params) => axiosClient.get(`/search/companies/${encodeURIComponent(company)}`, { params });
export const getSearchSuggestions = (params)    => axiosClient.get("/search/suggestions", { params });
export const getSearchStats       = ()          => axiosClient.get("/search/stats");
export const getMySearchProfile   = ()          => axiosClient.get("/search/me");
export const rebuildSearchProfile = ()          => axiosClient.post("/search/rebuild");
