import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Drops API
export const dropsAPI = {
  getAll: () => axios.get(`${API_URL}/drops`),
  getById: (id) => axios.get(`${API_URL}/drops/${id}`),
  joinWaitlist: (id, signupLatencyMs = 0) => 
    axios.post(`${API_URL}/drops/${id}/join`, { signup_latency_ms: signupLatencyMs }),
  leaveWaitlist: (id) => axios.post(`${API_URL}/drops/${id}/leave`),
  claim: (id) => axios.post(`${API_URL}/drops/${id}/claim`),
  getUserWaitlist: () => axios.get(`${API_URL}/drops/user/waitlist`),
  getUserClaims: () => axios.get(`${API_URL}/drops/user/claims`)
};

// Admin API
export const adminAPI = {
  getAllDrops: () => axios.get(`${API_URL}/admin/drops`),
  createDrop: (data) => axios.post(`${API_URL}/admin/drops`, data),
  updateDrop: (id, data) => axios.put(`${API_URL}/admin/drops/${id}`, data),
  deleteDrop: (id) => axios.delete(`${API_URL}/admin/drops/${id}`)
};

// Auth API
export const authAPI = {
  signup: (email, password) => axios.post(`${API_URL}/auth/signup`, { email, password }),
  login: (email, password) => axios.post(`${API_URL}/auth/login`, { email, password }),
  getMe: () => axios.get(`${API_URL}/auth/me`)
};

export default {
  drops: dropsAPI,
  admin: adminAPI,
  auth: authAPI
};