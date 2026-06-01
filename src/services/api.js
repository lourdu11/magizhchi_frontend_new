import axios from 'axios';

// Use Vite proxy in development (/api → localhost:5000)
// Use VITE_API_URL in production
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV
  ? '/api/v1'
  : 'https://magizhchi-backend-28sx.onrender.com/api/v1');

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000, // 30 seconds global timeout
  headers: { 'Content-Type': 'application/json' },
});

let inMemoryToken = null;

export const setToken = (token) => {
  inMemoryToken = token;
};

export const clearToken = () => {
  inMemoryToken = null;
};

export const checkAuthSession = async () => {
  if (inMemoryToken) return true;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
    const newToken = data?.data?.accessToken || data?.data?.data?.accessToken;
    if (newToken) {
      setToken(newToken);
      return true;
    }
    return false;
  } catch (err) {
    // Only clear session and log out if the server explicitly rejects the refresh token with 401 or 403
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      clearToken();
      return false;
    }
    // Retain session on transient network errors or 5xx server issues
    return true;
  }
};

// ─── Request Interceptor: attach token ───────────────
api.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
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
        setToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearToken();
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

// ✅ In-memory cache for static data to optimize free tier Render cold starts and avoid duplicate loads
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const cachedGet = async (url, ttl = CACHE_TTL) => {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.time < ttl) {
    return cached.data;
  }
  const res = await api.get(url);
  cache.set(url, { data: res, time: Date.now() });
  return res;
};

export default api;
