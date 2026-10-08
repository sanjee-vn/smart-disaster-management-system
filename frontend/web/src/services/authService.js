import api from './apiClient'

export const AUTH_SESSION_KEY = 'sdews-auth-session'

export const readAuthSession = () => {
  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_SESSION_KEY) || 'null')
    if (session?.token) api.defaults.headers.common.Authorization = `Bearer ${session.token}`
    return session
  } catch {
    return null
  }
}

export const saveAuthSession = (session) => {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
  api.defaults.headers.common.Authorization = `Bearer ${session.token}`
}

export const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_SESSION_KEY)
  delete api.defaults.headers.common.Authorization
}

api.interceptors.request.use((config) => {
  const session = readAuthSession()
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

export async function registerAccount(details) {
  const response = await api.post('/staff/auth/register', details)
  return response.data.data
}

export async function loginAccount(credentials) {
  const response = await api.post('/staff/auth/login', credentials)
  return response.data.data
}
