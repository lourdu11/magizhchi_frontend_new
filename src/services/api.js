import axios from 'axios';

// Use Vite proxy in development (/api → localhost:5000)
// Use VITE_API_URL in production
const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: attach token ───────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: refresh token on 401 ──────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for transient network errors (e.g. ERR_CONNECTION_CLOSED)
    if (!error.response && !originalRequest._retryCount && originalRequest.method === 'get') {
      originalRequest._retryCount = 1;
      return new Promise(resolve => setTimeout(() => resolve(api(originalRequest)), 1000));
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        sessionStorage.setItem('accessToken', newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem('accessToken');
        // Clear auth store state
        try {
          const { useAuthStore } = await import('../store');
          useAuthStore.getState().logout();
        } catch (_) {
          // Silently fail
        }
        return Promise.reject(refreshError);
      } finally {

        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
