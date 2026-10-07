import api from './apiClient'

export const getWarning = async (warningId) => {
  const response = await api.get(`/response-operations/warnings/${warningId}`)
  return response.data.data
}

export const updateWarning = async (warningId, payload) => {
  const response = await api.patch(`/response-operations/warnings/${warningId}`, payload)
  return response.data.data
}

export const getIncidents = async () => {
  const response = await api.get('/response-operations/incidents')
  return response.data.data
}

export const getIncident = async (incidentId) => {
  const response = await api.get(`/response-operations/incidents/${incidentId}`)
  return response.data.data
}

export const getAssignments = async ({ incidentId }) => {
  const response = await api.get('/response-operations/assignments', { params: incidentId ? { incidentId } : {} })
  return response.data.data
}

export const getTeams = async () => {
  const response = await api.get('/response-operations/teams')
  return response.data.data
}

export const getAgencies = async () => {
  const response = await api.get('/response-operations/agencies')
  return response.data.data
}

export const dispatchResponseAssignment = async (payload) => {
  const response = await api.post('/response-operations/assignments/dispatch', payload)
  return response.data.data
}
