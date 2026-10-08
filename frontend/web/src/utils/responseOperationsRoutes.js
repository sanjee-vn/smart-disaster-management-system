export const getResponseOperationsPaths = (incidentId) => incidentId ? {
  dashboard: `/response-operations/incidents/${incidentId}/resources`,
  create: (shelterId) => `/response-operations/incidents/${incidentId}/resources/new/${shelterId}`,
  review: `/response-operations/incidents/${incidentId}/resources/review`,
  processing: `/response-operations/incidents/${incidentId}/resources/processing`,
} : {
  dashboard: '/resource-coordination',
  create: (shelterId) => `/resource-coordination/distributions/new/${shelterId}`,
  review: '/resource-coordination/distributions/review',
  processing: '/resource-coordination/distributions/processing',
}

export const getStandaloneResponseContext = () => ({
  warningId: null,
  incidentId: null,
  responseId: null,
})

export const formatEnumLabel = (value) => value
  ? value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  : 'Not available'
