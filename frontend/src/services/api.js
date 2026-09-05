const API_BASE = '/api/v1';

export const getAuthToken = () => localStorage.getItem('sih_jwt_token');
export const setAuthToken = (token) => localStorage.setItem('sih_jwt_token', token);
export const clearAuthToken = () => localStorage.removeItem('sih_jwt_token');

export const getStoredUser = () => {
  const user = localStorage.getItem('sih_user');
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user) => localStorage.setItem('sih_user', JSON.stringify(user));
export const clearStoredUser = () => localStorage.removeItem('sih_user');

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Support HttpOnly/Secure/SameSite session cookies
    headers,
  });

  if (!res.ok) {
    let errorMessage = `Request failed with status ${res.status}`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (_) {
      try {
        errorMessage = await res.text();
      } catch (__) {}
    }
    const err = new Error(errorMessage);
    err.status = res.status;
    throw err;
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await res.json();
  }
  return res;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }),
  demoLogin: (username) => request('/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ username }),
  }),
  verifyTotp: (preAuthToken, code) => request('/auth/mfa/verify', {
    method: 'POST',
    body: JSON.stringify({ preAuthToken, code }),
  }),
  refreshToken: (refreshToken) => request('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }),
  requestPasswordReset: (identifier) => request('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  }),
  confirmPasswordReset: (token, newPassword) => request('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  }),
  logout: () => request('/auth/logout', {
    method: 'POST',
  }),

  // Cases
  getCases: () => request('/cases'),
  search: async (q) => {
    try {
      return await request(`/cases?search=${encodeURIComponent(q)}`);
    } catch (_) {
      return [];
    }
  },
  getCaseDetails: (id) => request(`/cases/${id}`),
  createCase: (data) => request('/cases', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  assignTeam: (caseId, data) => request(`/cases/${caseId}/assign`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateCaseStatus: (caseId, data) => request(`/cases/${caseId}/status`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  placeLegalHold: (caseId, reason) => request(`/cases/${caseId}/legal-hold`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
  liftLegalHold: (caseId) => request(`/cases/${caseId}/lift-legal-hold`, {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  closeCase: (caseId) => request(`/cases/${caseId}/close`, {
    method: 'POST',
    body: JSON.stringify({}),
  }),

  // Documents
  getCaseDocuments: (caseId) => request(`/cases/${caseId}/documents`),
  uploadDocument: (caseId, formData) => request(`/cases/${caseId}/documents`, {
    method: 'POST',
    body: formData,
  }),
  downloadDocument: async (documentId, filename) => {
    const res = await request(`/documents/${documentId}/download`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  signDocument: (documentId) => request(`/documents/${documentId}/sign`, {
    method: 'POST',
  }),

  // Evidence & Custody
  getCaseEvidence: (caseId) => request(`/cases/${caseId}/evidence`),
  registerEvidence: (caseId, data) => request(`/cases/${caseId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  initiateCustodyTransfer: (evidenceId, data) => request(`/evidence/${evidenceId}/transfer-request`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  acceptCustodyTransfer: (transferId, verificationNotes) => request(`/evidence/transfers/${transferId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ verificationNotes }),
  }),
  getCustodyTimeline: (evidenceId) => request(`/evidence/${evidenceId}/custody`),
  getPendingTransfers: () => request('/evidence/transfers/pending'),

  // Prosecution & Court
  getPreTrialBundle: (caseId) => request(`/court/cases/${caseId}/bundle`),
  recordCourtHearing: (caseId, data) => request(`/court/cases/${caseId}/hearings`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCourtHearings: (caseId) => request(`/court/cases/${caseId}/hearings`),

  // Audit Ledger & Security Alerts
  getAuditLogs: () => request('/audit/logs'),
  verifyHashChain: () => request('/audit/verify'),
  getSecurityAlerts: () => request('/security/alerts'),
  resolveSecurityAlert: (id, notes) => request(`/security/alerts/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  }),

  // Retention & Disposal
  getRetentionPolicies: () => request('/retention/policies'),
  createRetentionPolicy: (data) => request('/retention/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getDisposalRecords: () => request('/retention/disposals'),
  executeDisposal: (caseId, data) => request(`/retention/disposals/${caseId}`, {
    method: 'POST',
    body: JSON.stringify(data || {}),
  }),

  // Admin Users & Roles
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateUserStatus: (id, enabled, locked) => request(`/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled, locked }),
  }),
  getRoles: () => request('/admin/roles'),
  getPermissions: () => request('/admin/permissions'),

  // Search
  search: (query) => request(`/search?q=${encodeURIComponent(query)}`),
};
