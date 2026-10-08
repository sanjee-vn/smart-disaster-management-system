import api from './apiClient'

const unwrap = (response) => response.data.data

export const getHazards = async (filters = {}) => unwrap(await api.get('/hazards', { params: filters }))
export const createHazardFromReport = async (reportId) => unwrap(await api.post(`/reports/${encodeURIComponent(reportId)}/hazard`))
export const updateHazard = async (id, changes) => unwrap(await api.patch(`/hazards/${encodeURIComponent(id)}`, changes))
export const getWarningDraft = async (hazardId) => unwrap(await api.get(`/hazards/${encodeURIComponent(hazardId)}/draft`))
export const saveWarningDraft = async (hazardId, warning) => unwrap(await api.put(`/hazards/${encodeURIComponent(hazardId)}/draft`, { warning }))
export const getWarnings = async () => unwrap(await api.get('/warnings'))
export const publishWarning = async (payload) => unwrap(await api.post('/warnings', payload))
export const queueWarningRetry = async (id, channel) => unwrap(await api.post(`/warnings/${encodeURIComponent(id)}/retries`, { channel }))
export const escalateWarning = async (id) => unwrap(await api.post(`/warnings/${encodeURIComponent(id)}/escalations`))
export const cancelWarning = async (id) => unwrap(await api.post(`/warnings/${encodeURIComponent(id)}/cancellation`))
