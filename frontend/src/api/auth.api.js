// src/api/auth.api.js
import axiosClient from "./axiosClient";

export const registerUser    = (payload) => axiosClient.post("/auth/register", payload);
export const loginUser       = (payload) => axiosClient.post("/auth/login", payload);
export const logoutUser      = ()         => axiosClient.post("/auth/logout");
export const resetPassword   = (payload) => axiosClient.post("/auth/reset-password", payload);
export const changePassword  = (payload) => axiosClient.patch("/auth/change-password", payload);
