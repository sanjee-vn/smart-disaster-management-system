import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export const getApiErrorMessage = (error, fallback = 'The request could not be completed.') =>
  error.response?.data?.error?.message || error.response?.data?.message || error.message || fallback

export default apiClient
