import { useEffect, useState } from 'react'
import { getAssignments, getIncidents, getTeams } from '../services/responseOperationsService'
import { getShelters } from '../services/resourceCoordinationService'

const emptyData = { incidents: [], assignments: [], teams: [], shelters: [] }

export default function useResponseOperationsDashboard() {
  const [data, setData] = useState(emptyData)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const requests = [getIncidents(), getAssignments({}), getTeams(), getShelters()]
    const keys = ['incidents', 'assignments', 'teams', 'shelters']
    Promise.allSettled(requests).then((results) => {
      if (!active) return
      const nextData = { ...emptyData }
      const nextErrors = {}
      results.forEach((result, index) => {
        const key = keys[index]
        if (result.status === 'fulfilled') nextData[key] = result.value
        else nextErrors[key] = result.reason.response?.data?.message || `Unable to load ${key}.`
      })
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
