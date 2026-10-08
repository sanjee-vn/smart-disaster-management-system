import { useEffect, useState } from 'react'
import { getShelters } from '../services/resourceCoordinationService'
import { getAssignments, getIncident } from '../services/responseOperationsService'

export default function useShelterCoordinationData(incidentId) {
  const [incident, setIncident] = useState(null)
  const [assignment, setAssignment] = useState(null)
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(Boolean(incidentId))
  const [errors, setErrors] = useState({})
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!incidentId) return
    let active = true
    Promise.allSettled([getIncident(incidentId), getAssignments({ incidentId }), getShelters(incidentId)])
      .then(([incidentResult, assignmentResult, shelterResult]) => {
        if (!active) return
        const nextErrors = {}
        if (incidentResult.status === 'rejected') {
          if (incidentResult.reason.response?.status === 404) setNotFound(true)
          else nextErrors.incident = incidentResult.reason.response?.data?.message || 'Unable to load incident information.'
        } else {
          setIncident(incidentResult.value)
          setNotFound(false)
        }
        if (assignmentResult.status === 'fulfilled') setAssignment(assignmentResult.value[0] || null)
        else nextErrors.assignment = assignmentResult.reason.response?.data?.message || 'Response assignment information is unavailable.'
        if (shelterResult.status === 'fulfilled') setShelters(shelterResult.value)
        else nextErrors.shelters = shelterResult.reason.response?.data?.message || 'Unable to load incident shelters.'
        setErrors(nextErrors)
        setLoading(false)
      })
    return () => { active = false }
  }, [incidentId, reloadKey])

  const retry = () => {
    setLoading(Boolean(incidentId))
    setErrors({})
    setReloadKey((key) => key + 1)
  }

  return { incident, assignment, shelters, loading, errors, notFound, retry }
}
