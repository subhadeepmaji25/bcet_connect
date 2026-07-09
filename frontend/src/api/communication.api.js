import axiosClient from "./axiosClient";

// --- CONVERSATIONS ---
export const startConversation = (data) => axiosClient.post("/communication/conversations", data);
export const getMyConversations = (params) => axiosClient.get("/communication/conversations", { params });
export const getConversationById = (id) => axiosClient.get(`/communication/conversations/${id}`);
export const archiveConversation = (id) => axiosClient.patch(`/communication/conversations/${id}/archive`);
export const unarchiveConversation = (id) => axiosClient.patch(`/communication/conversations/${id}/unarchive`);

// --- ATTACHMENTS ---
export const uploadChatFile = (data) => axiosClient.post("/communication/attachments/file", data, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const uploadChatVoiceNote = (data) => axiosClient.post("/communication/attachments/voice", data, {
  headers: { "Content-Type": "multipart/form-data" }
});
export const uploadChatVideo = (data) => axiosClient.post("/communication/attachments/video", data, {
  headers: { "Content-Type": "multipart/form-data" }
});

// --- MESSAGES ---
export const sendMessage = (conversationId, data) => axiosClient.post(`/communication/conversations/${conversationId}/messages`, data);
export const getMessages = (conversationId, params) => axiosClient.get(`/communication/conversations/${conversationId}/messages`, { params });
export const markAsRead = (conversationId) => axiosClient.patch(`/communication/conversations/${conversationId}/read`);
export const editMessage = (messageId, data) => axiosClient.patch(`/communication/messages/${messageId}`, data);
export const deleteMessage = (messageId) => axiosClient.delete(`/communication/messages/${messageId}`);
