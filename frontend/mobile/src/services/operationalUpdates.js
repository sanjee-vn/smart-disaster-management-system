import api from './api';

const unwrap = response => response.data.data;
export async function loadOperationalUpdates() {
  const updateData = await api.get('/auth/staff/operational-updates').then(unwrap);
  const requestData = updateData?.requests;
  const incidentData = updateData?.incidents;
  const assignmentData = updateData?.assignments;
  const requests = Array.isArray(requestData) ? requestData : [];
  const incidents = Array.isArray(incidentData) ? incidentData : [];
  const assignments = Array.isArray(assignmentData) ? assignmentData : [];
  const active = incidents.filter(incident => incident.status !== 'RESOLVED');
  const distributions = Array.isArray(updateData?.distributions) ? updateData.distributions : [];
  return { requests, incidents: active, allIncidents: incidents, assignments, distributions };
}
export async function deliverOperationalRequest(requestId) {
  return api.post(`/response-operations/operational-requests/${encodeURIComponent(requestId)}/deliver`).then(unwrap);
}
export async function acceptDistribution(distributionId) {
  return api.patch(`/resource-coordination/distributions/${encodeURIComponent(distributionId)}/accept`).then(unwrap);
}
export async function acceptResponseAssignment(responseId) {
  return api.patch(`/response-operations/assignments/${encodeURIComponent(responseId)}/accept`).then(unwrap);
}
export async function deliverDistribution(distributionId, incidentId) {
  return api.patch(`/resource-coordination/distributions/${encodeURIComponent(distributionId)}/deliver`, { incidentId }).then(unwrap);
}

export async function acceptOperationalRequest(requestId) {
  return api.post(`/response-operations/operational-requests/${encodeURIComponent(requestId)}/accept`).then(unwrap);
}
