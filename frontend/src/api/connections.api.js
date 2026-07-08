// src/api/connections.api.js
import axiosClient from "./axiosClient";

export const sendConnectionRequest    = (data)          => axiosClient.post("/connections/requests", data);
export const getReceivedRequests      = (params)        => axiosClient.get("/connections/requests", { params });
export const getSentRequests          = (params)        => axiosClient.get("/connections/requests/sent", { params });
export const acceptConnectionRequest  = (requestId)     => axiosClient.patch(`/connections/requests/${requestId}/accept`);
export const rejectConnectionRequest  = (requestId)     => axiosClient.patch(`/connections/requests/${requestId}/reject`);
export const cancelConnectionRequest  = (requestId)     => axiosClient.patch(`/connections/requests/${requestId}/cancel`);
export const getMyConnections         = (params)        => axiosClient.get("/connections/connections", { params });
export const getConnectionStatus      = (userId)        => axiosClient.get(`/connections/connections/status/${userId}`);
export const removeConnection         = (userId)        => axiosClient.delete(`/connections/connections/${userId}`);
