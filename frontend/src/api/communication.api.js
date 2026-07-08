// src/api/communication.api.js
import axiosClient from "./axiosClient";

// ── Conversations ─────────────────────────────────────────────────────────
export const startConversation         = (data)                     => axiosClient.post("/communication/conversations", data);
export const getMyConversations        = (params)                   => axiosClient.get("/communication/conversations", { params });
export const getConversationById       = (conversationId)           => axiosClient.get(`/communication/conversations/${conversationId}`);
export const archiveConversation       = (conversationId)           => axiosClient.patch(`/communication/conversations/${conversationId}/archive`);
export const unarchiveConversation     = (conversationId)           => axiosClient.patch(`/communication/conversations/${conversationId}/unarchive`);

// ── Messages ──────────────────────────────────────────────────────────────
export const sendMessage               = (conversationId, data)     => axiosClient.post(`/communication/conversations/${conversationId}/messages`, data);
export const getMessages               = (conversationId, params)   => axiosClient.get(`/communication/conversations/${conversationId}/messages`, { params });
export const markAsRead                = (conversationId)           => axiosClient.patch(`/communication/conversations/${conversationId}/read`);
export const editMessage               = (messageId, data)          => axiosClient.patch(`/communication/messages/${messageId}`, data);
export const deleteMessage             = (messageId)                => axiosClient.delete(`/communication/messages/${messageId}`);

// ── Attachments ───────────────────────────────────────────────────────────
export const uploadChatFile            = (data)                     => axiosClient.post(`/communication/attachments/file`, data);
export const uploadChatVoiceNote       = (data)                     => axiosClient.post(`/communication/attachments/voice`, data);
export const uploadChatVideo           = (data)                     => axiosClient.post(`/communication/attachments/video`, data);
