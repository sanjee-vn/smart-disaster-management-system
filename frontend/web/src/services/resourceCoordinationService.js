import api from './apiClient'

export const getShelters = async (incidentId) => {
  const response = await api.get('/resource-coordination/shelters', { params: incidentId ? { incidentId } : {} })
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

export const commitDistribution = async (payload) => {
  const response = await api.post('/resource-coordination/distributions', payload)
  return response.data.data
}

export const getDistributions = async (incidentId) => {
  const response = await api.get('/resource-coordination/distributions', { params: { incidentId } })
  return response.data.data
}
