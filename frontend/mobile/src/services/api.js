import { create } from 'axios';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

let accessToken = null;
let onExpired = null;
export function setAccessToken(token) { accessToken = token; }
export function setSessionExpiredHandler(handler) { onExpired = handler; }
api.interceptors.request.use(config => {
  if (accessToken && !['/auth/login', '/auth/register'].includes(config.url)) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && accessToken && error.config?.headers?.Authorization === `Bearer ${accessToken}`) onExpired?.();
  return Promise.reject(error);
});

export default api;
