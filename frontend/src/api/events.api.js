import axiosClient from "./axiosClient";

export const getApprovedEvents = (params) => axiosClient.get("/events", { params });
export const getEventById = (eventId) => axiosClient.get(`/events/${eventId}`);
export const getMyEvents = (params) => axiosClient.get("/events/organizer/my", { params });
export const getPendingEvents = (params) => axiosClient.get("/events/admin/pending", { params });

export const createEvent = (data) => axiosClient.post("/events", data);
export const updateEvent = (eventId, data) => axiosClient.patch(`/events/${eventId}`, data);
export const deleteEvent = (eventId) => axiosClient.delete(`/events/${eventId}`);

export const approveEvent = (eventId) => axiosClient.patch(`/events/${eventId}/approve`);
export const rejectEvent = (eventId, data) => axiosClient.patch(`/events/${eventId}/reject`, data);
export const cancelEvent = (eventId, data) => axiosClient.patch(`/events/${eventId}/cancel`, data);
export const getEventAnalytics = (eventId) => axiosClient.get(`/events/${eventId}/analytics`);

export const toggleEventBookmark = (eventId) => axiosClient.post(`/events/${eventId}/bookmark`);
export const getMyEventBookmarks = (params) => axiosClient.get("/events/bookmarks/my", { params });

export const registerForEvent = (eventId) => axiosClient.post(`/events/${eventId}/register`);
export const cancelRegistration = (eventId) => axiosClient.patch(`/events/${eventId}/register/cancel`);
export const getMyRegistrations = (params) => axiosClient.get("/events/registrations/my", { params });
export const getEventRegistrations = (eventId, params) => axiosClient.get(`/events/${eventId}/registrations`, { params });

export const generateAttendanceToken = (eventId) => axiosClient.post(`/events/${eventId}/attendance/token`);
export const checkInWithToken = (eventId, data) => axiosClient.post(`/events/${eventId}/attendance/checkin/token`, data);
export const manualCheckIn = (eventId, data) => axiosClient.post(`/events/${eventId}/attendance/checkin/manual`, data);
export const getEventAttendance = (eventId, params) => axiosClient.get(`/events/${eventId}/attendance`, { params });
export const getMyAttendance = (params) => axiosClient.get("/events/attendance/my", { params });

export const issueCertificate = (eventId, data) => axiosClient.post(`/events/${eventId}/certificates`, data);
export const issueBulkCertificates = (eventId) => axiosClient.post(`/events/${eventId}/certificates/bulk`);
export const downloadCertificate = (eventId) => axiosClient.get(`/events/${eventId}/certificate`);
export const getMyCertificates = (params) => axiosClient.get("/events/certificates/my", { params });

export const submitEventFeedback = (eventId, data) => axiosClient.post(`/events/${eventId}/feedback`, data);
export const getEventFeedback = (eventId, params) => axiosClient.get(`/events/${eventId}/feedback`, { params });
export const getMyEventFeedback = (eventId) => axiosClient.get(`/events/${eventId}/feedback/my`);
