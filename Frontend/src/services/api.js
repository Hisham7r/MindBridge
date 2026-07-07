// Real HTTP client for the MindBridge backend.
// Replaces the former mock. Centralises base URL, JWT attachment, and error
// normalisation so pages can call typed-ish methods without touching fetch.

import { mapTherapist, uiTrackToApi } from './adapters';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'mindbridge_token';

// ── Token persistence (localStorage is the single source of truth) ───────────
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core request helper ──────────────────────────────────────────────────────
async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network/connection failure (server down, CORS, offline).
    const error = new Error('Cannot reach the server. Please try again.');
    error.status = 0;
    throw error;
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* response had no JSON body */
  }

  if (!res.ok) {
    const message = data?.error || data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export const api = {
  // ── Auth ──
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (name, email, password, role, extras = {}) =>
    request('/auth/register', { method: 'POST', body: { name, email, password, role, ...extras }, auth: false }),
  googleAuth: (credential) =>
    request('/auth/google', { method: 'POST', body: { credential }, auth: false }),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),

  // ── Therapists (public) ──
  getTherapists: async (filters = {}) => {
    const qs = new URLSearchParams();
    if (filters.track) qs.set('track', uiTrackToApi(filters.track));
    if (filters.specialization) qs.set('specialization', filters.specialization);
    if (filters.language) qs.set('language', filters.language);
    if (filters.minFee) qs.set('minFee', filters.minFee);
    if (filters.maxFee) qs.set('maxFee', filters.maxFee);
    const q = qs.toString();
    const data = await request(`/therapists${q ? `?${q}` : ''}`, { auth: false });
    return (data.therapists || []).map(mapTherapist);
  },
  getTherapist: async (id) => {
    const data = await request(`/therapists/${id}`, { auth: false });
    return mapTherapist(data.therapist);
  },
  getTherapistSlots: async (id, date) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    const data = await request(`/therapists/${id}/slots${q}`, { auth: false });
    return data.slots || [];
  },

  // ── Therapist self-service (auth) ──
  getMyTherapistProfile: async () => {
    const data = await request('/therapists/me');
    return data.therapist;
  },
  updateMyTherapistProfile: async (payload) => {
    const data = await request('/therapists/me', { method: 'PATCH', body: payload });
    return data.therapist;
  },

  // ── Sessions ──
  createSession: (payload) => request('/sessions', { method: 'POST', body: payload }),
  getMySessions: async () => {
    const data = await request('/sessions/my');
    return data.sessions || [];
  },
  getTherapistSessions: async () => {
    const data = await request('/sessions/therapist/my');
    return data.sessions || [];
  },
  setSessionZoomLink: (id, zoomLink) =>
    request(`/sessions/${id}/zoom`, { method: 'PATCH', body: { zoomLink } }),
  getSession: async (id) => {
    const data = await request(`/sessions/${id}`);
    return data.session;
  },
  updateSessionStatus: (id, status) =>
    request(`/sessions/${id}/status`, { method: 'PATCH', body: { status } }),

  // ── Payments ──
  submitPayment: (payload) => request('/payments', { method: 'POST', body: payload }),
  getPayment: async (id) => {
    const data = await request(`/payments/${id}`);
    return data.payment;
  },
  approvePayment: (id) => request(`/payments/${id}/approve`, { method: 'PATCH' }),
  rejectPayment: (id) => request(`/payments/${id}/reject`, { method: 'PATCH' }),

  // ── Admin ──
  getAdminStats: async () => {
    const data = await request('/admin/stats');
    return data.stats;
  },
  getAdminUsers: async () => {
    const data = await request('/admin/users');
    return data.users || [];
  },
  getAdminUser: async (id) => {
    const data = await request(`/admin/users/${id}`);
    return data.user;
  },
  getAdminSessions: async () => {
    const data = await request('/admin/sessions');
    return data.sessions || [];
  },
  getAdminPayments: async (status) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const data = await request(`/admin/payments${q}`);
    return data.payments || [];
  },
  getTherapistApplications: async (status) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const data = await request(`/admin/therapist-applications${q}`);
    return data.applications || [];
  },
  approveTherapist: (id) => request(`/admin/therapists/${id}/approve`, { method: 'PATCH' }),
  rejectTherapist: (id, reason) =>
    request(`/admin/therapists/${id}/reject`, { method: 'PATCH', body: { reason } }),

  // Admin therapist roster + suspension
  getAdminTherapists: async () => {
    const data = await request('/admin/therapists');
    return data.therapists || [];
  },
  suspendTherapist: (id) => request(`/admin/therapists/${id}/suspend`, { method: 'PATCH' }),
  reactivateTherapist: (id) => request(`/admin/therapists/${id}/reactivate`, { method: 'PATCH' }),
};
