import { useEffect, useState } from 'react'
import { getIncidents, getWarning } from '../services/responseOperationsService'

export default function useWarningReviewData(warningId) {
  const [warning, setWarning] = useState(null)
  const [incident, setIncident] = useState(null)
  const [loading, setLoading] = useState(Boolean(warningId))
  const [error, setError] = useState('')
  const [incidentError, setIncidentError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!warningId) return
    let active = true
    Promise.allSettled([getWarning(warningId), getIncidents()])
      .then(([warningResult, incidentsResult]) => {
        if (!active) return
        if (warningResult.status === 'rejected') {
          if (warningResult.reason.response?.status === 404) setNotFound(true)
          else setError(warningResult.reason.response?.data?.message || 'Unable to load warning information.')
          return
        }
        setWarning(warningResult.value)
        setNotFound(false)
        setError('')
        if (incidentsResult.status === 'rejected') {
          setIncident(null)
          setIncidentError(incidentsResult.reason.response?.data?.message || 'Linked incident information is temporarily unavailable.')
          return
        }
        const linkedIncident = incidentsResult.value.find((item) => item.warning?.warningId === warningResult.value.warningId) || null
        setIncident(linkedIncident)
        setIncidentError('')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [warningId, reloadKey])

  const retry = () => {
    setLoading(Boolean(warningId))
    setError('')
    setIncidentError('')
    setReloadKey((key) => key + 1)
  }

  return { warning, incident, loading, error, incidentError, notFound, retry }
}
