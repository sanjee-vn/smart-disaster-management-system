import api from './apiClient'

export async function getGroundReports() {
  const response = await api.get('/reports')
  return response.data.data
}

export async function reviewGroundReport(reportId, changes) {
  const response = await api.patch(`/reports/${reportId}/review`, changes)
  return response.data.data
}
