import { useEffect, useState } from 'react'
import { getAssignments, getIncident } from '../services/responseOperationsService'

export default function useIncidentResponseContext(incidentId) {
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(Boolean(incidentId))
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!incidentId) return
    let active = true
    Promise.all([getIncident(incidentId), getAssignments({ incidentId })])
      .then(([incident, assignments]) => {
        if (!active) return
        const assignment = assignments[0] || null
        setContext({
          incidentId: incident.incidentId,
          warningId: incident.warning?.warningId ?? null,
          responseId: assignment?.responseId ?? null,
          incidentName: `${incident.district} ${incident.hazardType} Response`,
          hazardType: incident.hazardType,
          severity: incident.severity,
          district: incident.district,
          responseStatus: assignment?.status ?? incident.status,
        })
        setError('')
      })
      .catch((requestError) => {
        if (!active) return
        setContext(null)
        setError(requestError.response?.data?.message || requestError.response?.data?.error?.message || 'Unable to load incident response context.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [incidentId, reloadKey])

  const reload = () => {
    setLoading(Boolean(incidentId))
    setError('')
    setReloadKey((key) => key + 1)
  }

  return { context, loading, error, reload }
}
