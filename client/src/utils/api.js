import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Attach JWT from store on every request
api.interceptors.request.use((config) => {
  // Import dynamically to avoid circular deps
  const token = window.__jssToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: try refresh, else logout
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = res.data.accessToken;
        window.__jssToken = newToken;
        // Update store
        const event = new CustomEvent('token:refresh', { detail: { token: newToken, user: res.data.user } });
        window.dispatchEvent(event);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;