const keyFor = (incidentId) => `component03:committed-distribution:${incidentId || 'standalone'}`

export const isCommittedDistribution = (distribution) => Boolean(
  distribution
  && typeof distribution.distributionId === 'string'
  && distribution.distributionId.trim()
  && distribution.status === 'EN_ROUTE'
  && typeof distribution.incidentId === 'string'
  && distribution.incidentId.trim()
  && distribution.shelterId
  && distribution.inventoryItemId
  && distribution.resourceOwnerId
  && distribution.deliveryResourceId
  && Number(distribution.quantity) > 0
  && (distribution.issuedAt || distribution.createdAt)
)

export const saveCommittedDistribution = (distribution) => {
  if (!isCommittedDistribution(distribution)) return false
  try {
    sessionStorage.setItem(keyFor(distribution.incidentId), JSON.stringify(distribution))
    return true
  } catch {
    return false
  }
}

export const loadCommittedDistribution = (incidentId) => {
  if (!incidentId) return null
  try {
    const raw = sessionStorage.getItem(keyFor(incidentId))
    const distribution = raw ? JSON.parse(raw) : null
    if (!isCommittedDistribution(distribution) || distribution.incidentId !== incidentId) {
      sessionStorage.removeItem(keyFor(incidentId))
      return null
    }
    return distribution
  } catch {
    try { sessionStorage.removeItem(keyFor(incidentId)) } catch { /* Storage may be unavailable. */ }
    return null
  }
}
