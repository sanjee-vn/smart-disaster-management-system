import api from './api';
export async function registerAccount(details) { return (await api.post('/auth/register', details)).data.data.user; }
export async function loginAccount(details) { return (await api.post('/auth/login', details)).data.data; }
export async function getCurrentUser() { return (await api.get('/auth/me')).data.data.user; }
export async function revokeSession() { await api.post('/auth/logout'); }
