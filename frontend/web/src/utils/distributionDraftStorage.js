const keyFor = (incidentId) => `component03:distribution-draft:${incidentId || 'standalone'}`

const isProcessingDraft = (draft, incidentId) => Boolean(
  draft
  && (draft.incidentId || null) === (incidentId || null)
  && typeof draft.requestId === 'string'
  && draft.requestId
  && draft.shelterId
  && draft.inventoryItemId
  && draft.resourceOwnerId
  && draft.deliveryResourceId
  && Number(draft.quantity) > 0
)

export const saveProcessingDraft = (draft) => {
  if (!isProcessingDraft(draft, draft?.incidentId)) return false
  try {
    sessionStorage.setItem(keyFor(draft.incidentId), JSON.stringify(draft))
    return true
  } catch {
    return false
  }
}

export const loadProcessingDraft = (incidentId) => {
  try {
    const value = sessionStorage.getItem(keyFor(incidentId))
    const draft = value ? JSON.parse(value) : null
    if (!isProcessingDraft(draft, incidentId)) {
      sessionStorage.removeItem(keyFor(incidentId))
      return null
    }
    return draft
  } catch {
    try { sessionStorage.removeItem(keyFor(incidentId)) } catch { /* Storage may be unavailable. */ }
    return null
  }
}

export const clearProcessingDraft = (incidentId) => {
  try { sessionStorage.removeItem(keyFor(incidentId)) } catch { /* Storage may be unavailable. */ }
}
