const BASE = '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('qx_admin_token') || localStorage.getItem('qx_token')
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.error || err.message || `HTTP ${res.status}`)
  }
  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json()
  }
  return res
}

export const api = {
  sendOtp: (data) => request('/auth/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  adminLogin: (data) => request('/auth/admin-login', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  lifetimeRequest: (data) => request('/auth/lifetime-request', { method: 'POST', body: JSON.stringify(data) }),

  getSupportedBrokers: () => request('/broker/supported'),
  connectBroker: (data) => request('/broker/connect', { method: 'POST', body: JSON.stringify(data) }),
  getUserConnections: (userId) => request(`/broker/user-connections/${userId}`),
  disconnectBroker: (data) => request('/broker/disconnect', { method: 'POST', body: JSON.stringify(data) }),
  syncBrokerData: (data) => request('/broker/sync-real-quotex-data', { method: 'POST', body: JSON.stringify(data) }),

  getStrategies: (params) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/strategy${q}`)
  },
  saveStrategy: (data) => request('/strategy/save', { method: 'POST', body: JSON.stringify(data) }),

  getTradingSession: (userId) => request(`/trading/session/${userId}`),
  startTrading: (data) => request('/trading/start', { method: 'POST', body: JSON.stringify(data) }),
  pauseTrading: (data) => request('/trading/pause', { method: 'POST', body: JSON.stringify(data) }),
  resumeTrading: (data) => request('/trading/resume', { method: 'POST', body: JSON.stringify(data) }),
  stopTrading: (data) => request('/trading/stop', { method: 'POST', body: JSON.stringify(data) }),
  emergencyStop: (data) => request('/trading/emergency-stop', { method: 'POST', body: JSON.stringify(data) }),
  updateRiskSettings: (data) => request('/trading/risk-settings', { method: 'POST', body: JSON.stringify(data) }),

  getAdminStats: () => request('/admin/stats'),
  getAdminUsers: () => request('/admin/users'),
  addAdminUser: (data) => request('/admin/add-user', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminUser: (data) => request('/admin/delete-user', { method: 'POST', body: JSON.stringify(data) }),
  bulkDeleteAdminUsers: (data) => request('/admin/bulk-delete-users', { method: 'POST', body: JSON.stringify(data) }),
  editUserDetails: (data) => request('/admin/edit-user-details', { method: 'POST', body: JSON.stringify(data) }),
  resetUserPassword: (data) => request('/admin/reset-user-password', { method: 'POST', body: JSON.stringify(data) }),
  toggleUserActive: (data) => request('/admin/toggle-user-active', { method: 'POST', body: JSON.stringify(data) }),
  forceStopUser: (data) => request('/admin/force-stop-user', { method: 'POST', body: JSON.stringify(data) }),
  getLiveSessions: () => request('/admin/live-sessions'),
  getAllTradeLogs: () => request('/admin/all-trade-logs'),
  getAuditLogs: () => request('/admin/audit-logs'),
  getSiteConfig: () => request('/admin/site-config'),
  updateSiteConfig: (data) => request('/admin/site-config', { method: 'POST', body: JSON.stringify(data) }),
  changeAdminPassword: (data) => request('/admin/change-admin-password', { method: 'POST', body: JSON.stringify(data) }),
  toggleMaintenance: (data) => request('/admin/toggle-maintenance', { method: 'POST', body: JSON.stringify(data) }),
  globalEmergencyStop: (data) => request('/admin/global-emergency-stop', { method: 'POST', body: JSON.stringify(data) }),
  clearEmergencyStop: (data) => request('/admin/clear-emergency-stop', { method: 'POST', body: JSON.stringify(data) }),
  toggleEmergencyControl: (data) => request('/admin/toggle-emergency-control', { method: 'POST', body: JSON.stringify(data) }),
  getAdminAnnouncements: () => request('/admin/announcements'),
  createAnnouncement: (data) => request('/admin/announcements', { method: 'POST', body: JSON.stringify(data) }),
  updateAnnouncement: (id, data) => request(`/admin/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnnouncement: (data) => request('/admin/delete-announcement', { method: 'POST', body: JSON.stringify(data) }),
  toggleAnnouncementActive: (data) => request('/admin/toggle-announcement-active', { method: 'POST', body: JSON.stringify(data) }),
  getPlanSubscriptions: () => request('/admin/plan-subscriptions'),
  approvePlanSubscription: (data) => request('/admin/approve-plan-subscription', { method: 'POST', body: JSON.stringify(data) }),
  rejectPlanSubscription: (data) => request('/admin/reject-plan-subscription', { method: 'POST', body: JSON.stringify(data) }),
  editDepositRequest: (data) => request('/admin/edit-deposit-request', { method: 'POST', body: JSON.stringify(data) }),
  deletePlanSubscription: (data) => request('/admin/delete-plan-subscription', { method: 'POST', body: JSON.stringify(data) }),
  bulkDeletePlanSubscriptions: (data) => request('/admin/bulk-delete-plan-subscriptions', { method: 'POST', body: JSON.stringify(data) }),
  clearTestPlanSubscriptions: () => request('/admin/clear-test-plan-subscriptions', { method: 'POST' }),
  getCommissionWithdrawals: () => request('/admin/commission-withdrawals'),
  approveCommissionWithdrawal: (data) => request('/admin/approve-commission-withdrawal', { method: 'POST', body: JSON.stringify(data) }),
  editCommissionWithdrawal: (data) => request('/admin/edit-commission-withdrawal', { method: 'POST', body: JSON.stringify(data) }),
  reactivateFreeTrial: (data) => request('/admin/reactivate-free-trial', { method: 'POST', body: JSON.stringify(data) }),
  addStrategy: (data) => request('/admin/add-strategy', { method: 'POST', body: JSON.stringify(data) }),
  editStrategy: (data) => request('/admin/edit-strategy', { method: 'POST', body: JSON.stringify(data) }),
  deleteStrategy: (data) => request('/admin/delete-strategy', { method: 'POST', body: JSON.stringify(data) }),
  toggleStrategyActive: (data) => request('/admin/toggle-strategy-active', { method: 'POST', body: JSON.stringify(data) }),
  getLiveSessions: () => request('/admin/live-sessions'),
  getActivityLogs: () => request('/admin/activity-logs'),
  stopTrading: (data) => request('/admin/force-stop-session', { method: 'POST', body: JSON.stringify(data) }),

  // Plan Management
  getPlans: () => request('/admin/plans'),
  addPlan: (data) => request('/admin/plans', { method: 'POST', body: JSON.stringify(data) }),
  updatePlan: (data) => request('/admin/plans/update', { method: 'POST', body: JSON.stringify(data) }),
  deletePlan: (data) => request('/admin/plans/delete', { method: 'POST', body: JSON.stringify(data) }),
  getPublicPlans: () => request('/user/public-plans'),
  updateStrategyParameters: (data) => request('/admin/strategy-parameters', { method: 'POST', body: JSON.stringify(data) }),

  getUserNotifications: (userId) => request(`/user/notifications/${userId}`),
  updateUserNotifications: (data) => request('/user/notifications', { method: 'POST', body: JSON.stringify(data) }),
  getUserSecurity: (userId) => request(`/user/security/${userId}`),
  toggle2FA: (data) => request('/user/toggle-2fa', { method: 'POST', body: JSON.stringify(data) }),
  getUserSiteConfig: () => request('/user/site-config'),
  getUserAnnouncements: () => request('/user/announcements'),
  getUserProfile: (userId) => request(`/user/profile/${userId}`),
  updateUserProfile: (data) => request('/user/profile', { method: 'POST', body: JSON.stringify(data) }),
  getUserSubscriptions: (userId) => request(`/user/subscriptions/${userId}`),
  subscribePlan: (data) => request('/user/subscribe-plan', { method: 'POST', body: JSON.stringify(data) }),
  changePassword: (data) => request('/user/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logoutOtherSessions: (data) => request('/user/logout-other-sessions', { method: 'POST', body: JSON.stringify(data) }),

  exportReport: (userId, format) => request(`/reports/export/${userId}?format=${format}`),

  health: () => request('/health'),
}

export function createWebSocket(userId) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const ws = new WebSocket(`${protocol}//${window.location.host}`)
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'SUBSCRIBE_USER', userId }))
  }
  return ws
}
