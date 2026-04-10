/**
 * /client/src/api/client.js
 * Production Axios instance.
 * - Attaches JWT from localStorage on every request
 * - On 401: clears token + redirects to /login
 * - On 5xx: logs error and rethrows
 */
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// ── Request interceptor: attach token ────────────────────────────────────────
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth failures and server errors ─────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    if (status >= 500) {
      if (import.meta.env.DEV) {
        console.error('[API] Server error:', error.response?.data || error.message);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
