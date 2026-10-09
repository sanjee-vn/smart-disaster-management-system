import api from './apiClient'

export const getShelters = async (incidentId) => {
  const response = await api.get('/resource-coordination/shelters', { params: incidentId ? { incidentId } : {} })
  return response.data.data
}

export const registerShelter = async (payload) => {
  const response = await api.post('/resource-coordination/shelters', payload)
  return response.data.data
}

export const getShelterById = async (id) => {
  const response = await api.get(`/resource-coordination/shelters/${id}`)
  return response.data.data
}

export const getInventory = async (category, availableOnly = false) => {
  const response = await api.get('/resource-coordination/inventory', { params: { ...(category ? { category } : {}), ...(availableOnly ? { availableOnly: 'true' } : {}) } })
  return response.data.data
}

export const getInventoryItemById = async (id) => {
  const response = await api.get(`/resource-coordination/inventory/${id}`)
  return response.data.data
}

export const getDeliveryResources = async (status) => {
  const response = await api.get('/resource-coordination/delivery-resources', { params: status ? { status } : {} })
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
