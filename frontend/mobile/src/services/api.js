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
  if (accessToken && !['/auth/login', '/auth/register'].includes(config.url)) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
api.interceptors.response.use(response => response, error => {
  const path = String(error.config?.url || '');
  const isPublicAuthenticationRequest = ['/auth/login', '/auth/register', '/staff/auth/login', '/staff/auth/register'].includes(path);
  const sentAuthorization = error.config?.headers?.get?.('Authorization')
    || error.config?.headers?.Authorization
    || error.config?.headers?.authorization;
  if (error.response?.status === 401 && !isPublicAuthenticationRequest && accessToken
    && sentAuthorization === `Bearer ${accessToken}`) onExpired?.();
  return Promise.reject(error);
});

export default api;
