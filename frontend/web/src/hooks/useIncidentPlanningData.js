import { useEffect, useState } from 'react'
import { getAssignments, getIncident } from '../services/responseOperationsService'

export default function useIncidentPlanningData(incidentId) {
  const [incident, setIncident] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(Boolean(incidentId))
  const [error, setError] = useState('')
  const [assignmentError, setAssignmentError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!incidentId) return
    let active = true
    Promise.allSettled([getIncident(incidentId), getAssignments({ incidentId })])
      .then(([incidentResult, assignmentResult]) => {
        if (!active) return
        if (incidentResult.status === 'rejected') {
          if (incidentResult.reason.response?.status === 404) setNotFound(true)
          else setError(incidentResult.reason.response?.data?.message || 'Unable to load incident information.')
          return
        }
        setIncident(incidentResult.value)
        setError('')
        setNotFound(false)
        if (assignmentResult.status === 'rejected') {
          setAssignments([])
          setAssignmentError(assignmentResult.reason.response?.data?.message || 'Existing response information is temporarily unavailable.')
        } else {
          setAssignments(assignmentResult.value)
          setAssignmentError('')
        }
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [incidentId, reloadKey])

  const retry = () => {
    setLoading(Boolean(incidentId))
    setError('')
    setAssignmentError('')
    setReloadKey((key) => key + 1)
  }

  return { incident, assignments, loading, error, assignmentError, notFound, retry }
}
