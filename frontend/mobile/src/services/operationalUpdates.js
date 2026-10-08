import api from './api';

const unwrap = response => response.data.data;
export async function loadOperationalUpdates() {
  const [requests, incidents] = await Promise.all([
    api.get('/response-operations/operational-requests').then(unwrap),
    api.get('/response-operations/incidents').then(unwrap),
  ]);
  const active = incidents.filter(incident => incident.status !== 'RESOLVED');
  const distributions = (await Promise.all(active.map(incident => api.get('/resource-coordination/distributions', { params: { incidentId: incident.incidentId } }).then(unwrap).catch(() => [])))).flat();
  return { requests, incidents: active, distributions };
}
