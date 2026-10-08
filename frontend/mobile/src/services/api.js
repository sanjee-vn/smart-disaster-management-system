import { create } from 'axios';

const api = create({
  baseURL: 'http://10.80.190.202:5000/api',
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
