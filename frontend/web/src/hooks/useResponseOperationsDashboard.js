import { useEffect, useState } from 'react'
import { getAssignments, getIncidents, getTeams } from '../services/responseOperationsService'
import { getDistributions, getShelters } from '../services/resourceCoordinationService'

const emptyData = { incidents: [], assignments: [], teams: [], shelters: [], distributions: [] }

export default function useResponseOperationsDashboard() {
  const [data, setData] = useState(emptyData)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const requests = [getIncidents(), getAssignments({}), getTeams(), getShelters()]
    const keys = ['incidents', 'assignments', 'teams', 'shelters']
    Promise.allSettled(requests).then(async (results) => {
      if (!active) return
      const nextData = { ...emptyData }
      const nextErrors = {}
      results.forEach((result, index) => {
        const key = keys[index]
        if (result.status === 'fulfilled') nextData[key] = result.value
        else nextErrors[key] = result.reason.response?.data?.message || `Unable to load ${key}.`
      })
      if (results[0].status === 'fulfilled') {
        const distributionResults = await Promise.allSettled(results[0].value.map((incident) => getDistributions(incident.incidentId)))
        if (!active) return
        nextData.distributions = distributionResults.flatMap((result) => result.status === 'fulfilled' ? result.value : [])
        if (distributionResults.some((result) => result.status === 'rejected')) nextErrors.distributions = 'Unable to load distributions for one or more incidents.'
      }
      setData(nextData)
      setErrors(nextErrors)
      setLoading(false)
    })
    return () => { active = false }
  }, [reloadKey])

  const retry = () => {
    setLoading(true)
    setErrors({})
    setReloadKey((key) => key + 1)
  }

  return { ...data, errors, loading, retry }
}
