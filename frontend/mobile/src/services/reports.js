import api from './api';
export async function uploadReportPhoto(asset) {
  const body = new FormData();
  body.append('photo', { uri: asset.uri, name: asset.fileName || 'incident.jpg', type: asset.mimeType || 'image/jpeg' });
  const response = await api.post('/reports/photo', body, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
  return response.data.data.photo;
}
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
