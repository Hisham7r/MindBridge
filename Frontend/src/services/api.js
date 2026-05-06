import {
  therapists,
  patientSessions,
  pastSessions,
  therapistSchedule,
  adminPayments,
  adminTherapists,
} from '../data/mockData';

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  // Auth
  login: async (email, password) => Promise.resolve({ role: 'patient', user: {} }),
  register: async (name, email, password, role) => Promise.resolve({ role, user: {} }),
  getMe: async () => Promise.resolve(null),

  // Therapists
  getTherapists: async (filters = {}) => Promise.resolve(therapists),
  getTherapist: async (id) => Promise.resolve(therapists.find(t => t.id === parseInt(id)) || null),
  getTherapistSlots: async (id, date) => {
    const t = therapists.find(th => th.id === parseInt(id));
    return Promise.resolve(t?.availableSlots?.[date] || []);
  },

  // Sessions
  getPatientSessions: async () => Promise.resolve({ upcoming: patientSessions, past: pastSessions }),
  getTherapistSchedule: async () => Promise.resolve(therapistSchedule),

  // Payments
  submitPayment: async (payload) => Promise.resolve({ success: true }),
  getAdminPayments: async () => Promise.resolve(adminPayments),
  approvePayment: async (id) => Promise.resolve({ success: true }),

  // Admin
  getAdminTherapists: async () => Promise.resolve(adminTherapists),
};
