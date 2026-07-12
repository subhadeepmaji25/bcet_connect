import axiosClient from './axiosClient';

const adminApi = {
  // 1. Dashboard
  getDashboardOverview: () => axiosClient.get('/admin/dashboard/overview').then(res => res.data?.data || res.data),
  getDashboardUsers: () => axiosClient.get('/admin/dashboard/users').then(res => res.data?.data || res.data),
  getDashboardPendingCounts: () => axiosClient.get('/admin/dashboard/pending-counts').then(res => res.data?.data || res.data),
  
  // 2. User Management
  getUsers: (params) => axiosClient.get('/admin/users', { params }).then(res => res.data?.data || res.data),
  getPendingUsers: (params) => axiosClient.get('/admin/users/pending', { params }).then(res => res.data?.data || res.data),
  getUserById: (id) => axiosClient.get(`/admin/users/${id}`).then(res => res.data?.data || res.data),
  updateUserStatus: (id, action, reason) => axiosClient.patch(`/admin/users/${id}/${action}`, { reason }).then(res => res.data?.data || res.data),
  
  // 3. Approval Center
  getUnifiedPendingQueue: () => axiosClient.get('/admin/approvals').then(res => res.data?.data || res.data),
  getPendingByType: (type, params) => axiosClient.get(`/admin/approvals/${type}`, { params }).then(res => res.data?.data || res.data),
  decideApproval: (type, id, action, reason) => axiosClient.patch(`/admin/approvals/${type}/${id}/decide`, { decision: action, reason }).then(res => res.data?.data || res.data),
  
  // 4. Moderation
  getReports: (params) => axiosClient.get('/admin/moderation/reports', { params }).then(res => res.data?.data || res.data),
  resolveReport: (id) => axiosClient.patch(`/admin/moderation/reports/${id}/resolve`).then(res => res.data?.data || res.data),
  deletePost: (id, reason) => axiosClient.delete(`/admin/moderation/posts/${id}`, { data: { reason } }).then(res => res.data?.data || res.data),
  hidePost: (id, reason) => axiosClient.patch(`/admin/moderation/posts/${id}/hide`, { reason }).then(res => res.data?.data || res.data),
  suspendCommunity: (id, reason) => axiosClient.patch(`/admin/moderation/communities/${id}/suspend`, { reason }).then(res => res.data?.data || res.data),
  disbandCommunity: (id, reason) => axiosClient.patch(`/admin/moderation/communities/${id}/disband`, { reason }).then(res => res.data?.data || res.data),
  
  // 5. Broadcast
  sendBroadcast: (data) => axiosClient.post('/admin/broadcast', data).then(res => res.data?.data || res.data),
  
  // 6. Audit Logs
  getAuditLogs: (params) => axiosClient.get('/admin/audit-logs', { params }).then(res => res.data?.data || res.data)
};

export default adminApi;
