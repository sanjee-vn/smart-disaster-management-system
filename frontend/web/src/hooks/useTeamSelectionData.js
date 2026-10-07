import { useEffect, useState } from 'react'
import { getAgencies, getAssignments, getIncident, getTeams } from '../services/responseOperationsService'

export default function useTeamSelectionData(incidentId) {
  const [incident, setIncident] = useState(null)
  const [agencies, setAgencies] = useState([])
  const [teams, setTeams] = useState([])
  const [assignments, setAssignments] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(Boolean(incidentId))
  const [notFound, setNotFound] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!incidentId) return
    let active = true
    Promise.allSettled([getIncident(incidentId), getAgencies(), getTeams(), getAssignments({ incidentId })])
      .then(([incidentResult, agencyResult, teamResult, assignmentResult]) => {
        if (!active) return
        const nextErrors = {}
        if (incidentResult.status === 'rejected') {
          if (incidentResult.reason.response?.status === 404) setNotFound(true)
          else nextErrors.incident = incidentResult.reason.response?.data?.message || 'Unable to load incident information.'
        } else {
          setIncident(incidentResult.value)
          setNotFound(false)
        }
        if (agencyResult.status === 'fulfilled') setAgencies(agencyResult.value)
        else nextErrors.agencies = agencyResult.reason.response?.data?.message || 'Unable to load agencies.'
        if (teamResult.status === 'fulfilled') setTeams(teamResult.value)
        else nextErrors.teams = teamResult.reason.response?.data?.message || 'Unable to load response teams.'
        if (assignmentResult.status === 'fulfilled') setAssignments(assignmentResult.value)
        else nextErrors.assignments = assignmentResult.reason.response?.data?.message || 'Unable to load existing response assignments.'
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

  return { incident, agencies, teams, assignments, errors, loading, notFound, retry }
}
