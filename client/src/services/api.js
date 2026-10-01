import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  config.headers['X-Timezone-Offset'] = String(new Date().getTimezoneOffset());
  return config;
});

export const getErrorMessage = (error) => error.response?.data?.message || 'Could not connect. Check your connection and try again.';

export default api;
