// src/api/mentorship.api.js
import axiosClient from "./axiosClient";

// ── Mentors ───────────────────────────────────────────────────────────────
export const listMentors            = (params)          => axiosClient.get("/mentorship/mentors", { params });
export const getVerifiedMentors     = (params)          => axiosClient.get("/mentorship/mentors/verified", { params });
export const getTopMentors          = (params)          => axiosClient.get("/mentorship/mentors/top", { params });
export const getPublicMentorProfile = (mentorId)        => axiosClient.get(`/mentorship/profile/${mentorId}`);
export const getMyMentorProfile     = ()                => axiosClient.get("/mentorship/profile/me");
export const becomeMentor           = (data)            => axiosClient.post("/mentorship/profile", data);
export const updateMentorProfile    = (data)            => axiosClient.patch("/mentorship/profile", data);
export const updateProfileVisibility = (data)           => axiosClient.patch("/mentorship/profile/visibility", data);
export const deactivateMentorProfile = ()               => axiosClient.delete("/mentorship/profile");
export const reactivateMentorProfile = ()               => axiosClient.patch("/mentorship/profile/reactivate");
export const verifyMentor           = (mentorId)        => axiosClient.patch(`/mentorship/profile/${mentorId}/verify`);

// ── Requests ──────────────────────────────────────────────────────────────
export const sendMentorshipRequest  = (data)            => axiosClient.post("/mentorship/requests", data);
export const getMyRequests          = (params)          => axiosClient.get("/mentorship/requests", { params });
export const getReceivedRequests    = (params)          => axiosClient.get("/mentorship/requests/received", { params });
export const getRequestById         = (requestId)       => axiosClient.get(`/mentorship/requests/${requestId}`);
export const acceptRequest          = (requestId, data) => axiosClient.patch(`/mentorship/requests/${requestId}/accept`, data);
export const rejectRequest          = (requestId, data) => axiosClient.patch(`/mentorship/requests/${requestId}/reject`, data);
export const cancelRequest          = (requestId)       => axiosClient.patch(`/mentorship/requests/${requestId}/cancel`);

// Sessions
export const scheduleSession        = (data)            => axiosClient.post("/mentorship/sessions", data);
export const getMySessions          = (params)          => axiosClient.get("/mentorship/sessions", { params });
export const getSessionById         = (sessionId)       => axiosClient.get(`/mentorship/sessions/${sessionId}`);
export const completeSession        = (sessionId)       => axiosClient.patch(`/mentorship/sessions/${sessionId}/complete`);
export const cancelSession          = (sessionId, data) => axiosClient.patch(`/mentorship/sessions/${sessionId}/cancel`, data);

// Reviews
export const createReview           = (sessionId, data) => axiosClient.post(`/mentorship/sessions/${sessionId}/review`, data);
export const getMentorReviews       = (mentorId, params) => axiosClient.get(`/mentorship/mentors/${mentorId}/reviews`, { params });
