import api from './api';
export async function submitGroundReport(report) {
  const response = await api.post('/reports', report);
  return response.data.data;
}

export async function getPublishedAlerts() {
  const response = await api.get('/reports/alerts');
  return response.data.data;
}

export async function getMyReports() {
  const response = await api.get('/reports/mine');
  return response.data.data;
}
