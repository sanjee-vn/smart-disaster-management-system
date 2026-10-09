import { useEffect, useState } from 'react'
import { getAssignments, getIncidents, getOperationalRequests, getTeams } from '../services/responseOperationsService'
import { getDeliveryResources, getDistributions, getInventory, getShelters } from '../services/resourceCoordinationService'

const emptyData = { incidents: [], assignments: [], requests: [], teams: [], shelters: [], distributions: [], inventory: [], deliveryResources: [] }

export default function useResponseOperationsDashboard(includeResourceDetails = false) {
  const [data, setData] = useState(emptyData)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    const requests = [getIncidents(), getAssignments({}), getOperationalRequests(), getTeams(), getShelters()]
    const keys = ['incidents', 'assignments', 'requests', 'teams', 'shelters']
    if (includeResourceDetails) {
      requests.push(getInventory(), getDeliveryResources())
      keys.push('inventory', 'deliveryResources')
    }
    Promise.allSettled(requests).then(async (results) => {
      if (!active) return
      const nextData = { ...emptyData }
      const nextErrors = {}
      results.forEach((result, index) => {
        const key = keys[index]
        if (result.status === 'fulfilled') nextData[key] = Array.isArray(result.value) ? result.value : []
        else nextErrors[key] = result.reason.response?.data?.error?.message || result.reason.response?.data?.message || `Unable to load ${key}.`
      })
      if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
        const distributionResults = await Promise.allSettled(results[0].value.map((incident) => getDistributions(incident.incidentId)))
        if (!active) return
        nextData.distributions = distributionResults.flatMap((result) => result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [])
        if (distributionResults.some((result) => result.status === 'rejected')) nextErrors.distributions = 'Unable to load distributions for one or more incidents.'
      }
      setData(nextData)
      setErrors(nextErrors)
      setLoading(false)
    })
    return () => { active = false }
  }, [includeResourceDetails, reloadKey])

  const retry = () => {
    setLoading(true)
    setErrors({})
    setReloadKey((key) => key + 1)
  }

  return { ...data, errors, loading, retry }
}
