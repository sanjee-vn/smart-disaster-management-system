import { useCallback, useEffect, useState } from 'react'
import { getDistributions, getShelters } from '../services/resourceCoordinationService'
import { getAssignments, getIncident, getOperationalRequests } from '../services/responseOperationsService'

export default function useResponseMonitoringData(incidentId) {
  const [data, setData] = useState({ incident: null, assignment: null, requests: [], shelters: [], distributions: [] })
  const [loading, setLoading] = useState(Boolean(incidentId))
  const [error, setError] = useState('')
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const load = useCallback(async () => {
    if (!incidentId) return
    try {
      const [incident, assignments, requests, shelters, distributions] = await Promise.all([
        getIncident(incidentId), getAssignments({ incidentId }), getOperationalRequests({ incidentId }), getShelters(incidentId), getDistributions(incidentId),
      ])
      setData({ incident, assignment: assignments[0] || null, requests, shelters, distributions })
      setLastRefreshed(new Date())
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || requestError.response?.data?.message || 'Unable to load current response monitoring data.')
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  useEffect(() => { queueMicrotask(load) }, [load])
  const refresh = async () => { setLoading(true); await load() }
  return { ...data, loading, error, lastRefreshed, refresh }
}
