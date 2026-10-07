import api from './api';
export async function submitGroundReport(report) {
  const response = await api.post('/reports', report);
  return response.data.data;
}
