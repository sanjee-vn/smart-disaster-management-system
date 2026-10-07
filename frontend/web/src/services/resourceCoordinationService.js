import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'

const api = axios.create({ baseURL: API_BASE_URL })

export const getShelters = async () => {
  const response = await api.get('/resource-coordination/shelters')
  return response.data.data
}

export const getShelterById = async (id) => {
  const response = await api.get(`/resource-coordination/shelters/${id}`)
  return response.data.data
}

export const getInventory = async (category) => {
  const response = await api.get('/resource-coordination/inventory', { params: category ? { category } : {} })
  return response.data.data
}

export const getInventoryItemById = async (id) => {
  const response = await api.get(`/resource-coordination/inventory/${id}`)
  return response.data.data
}

export const getDeliveryResources = async () => {
  const response = await api.get('/resource-coordination/delivery-resources')
  return response.data.data
}

export const getDeliveryResourceById = async (id) => {
  const response = await api.get(`/resource-coordination/delivery-resources/${id}`)
  return response.data.data
}
