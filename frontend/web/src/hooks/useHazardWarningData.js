import { useCallback, useEffect, useState } from 'react'
import {
  cancelWarning,
  createHazardFromReport,
  escalateWarning,
  getHazards,
  getWarningDraft,
  getWarnings,
  publishWarning,
  queueWarningRetry,
  saveWarningDraft,
  updateHazard as saveHazard,
} from '../services/hazardWarningService'
import { getApiErrorMessage } from '../services/apiClient'

export default function useHazardWarningData() {
  const [hazards, setHazards] = useState([])
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [hazardRecords, warningRecords] = await Promise.all([getHazards(), getWarnings()])
      setHazards(hazardRecords)
      setWarnings(warningRecords)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Could not load hazard and warning data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadInitialData = async () => {
      try {
        const [hazardRecords, warningRecords] = await Promise.all([getHazards(), getWarnings()])
        if (!active) return
        setHazards(hazardRecords)
        setWarnings(warningRecords)
      } catch (requestError) {
        if (active) setError(getApiErrorMessage(requestError, 'Could not load hazard and warning data.'))
      } finally {
        if (active) setLoading(false)
      }
    }
    void loadInitialData()
    return () => { active = false }
  }, [])

  const updateHazard = useCallback(async (hazardId, changes) => {
    const updated = await saveHazard(hazardId, changes)
    setHazards((current) => current.map((hazard) => hazard.id === hazardId ? updated : hazard))
    return updated
  }, [])

  const ensureReportHazard = useCallback(async (reportId) => {
    const hazard = await createHazardFromReport(reportId)
    setHazards((current) => [hazard, ...current.filter((item) => item.id !== hazard.id)])
    return hazard
  }, [])

  const loadDraft = useCallback((hazardId) => getWarningDraft(hazardId), [])
  const saveDraft = useCallback((hazardId, warning) => saveWarningDraft(hazardId, warning), [])

  const publish = useCallback(async (payload) => {
    const created = await publishWarning(payload)
    setWarnings((current) => [created, ...current])
    setHazards((current) => current.map((hazard) => hazard.id === created.hazardId
      ? { ...hazard, status: 'Warning Issued', updatedAt: created.createdAt }
      : hazard))
    return created
  }, [])

  const applyWarningUpdate = useCallback((updated) => {
    setWarnings((current) => current.map((warning) => warning.id === updated.id ? updated : warning))
    return updated
  }, [])

  const retry = useCallback(async (id, channel) => applyWarningUpdate(await queueWarningRetry(id, channel)), [applyWarningUpdate])
  const escalate = useCallback(async (id) => applyWarningUpdate(await escalateWarning(id)), [applyWarningUpdate])
  const cancel = useCallback(async (id) => {
    const updated = applyWarningUpdate(await cancelWarning(id))
    await refresh()
    return updated
  }, [applyWarningUpdate, refresh])

  return { hazards, warnings, loading, error, refresh, updateHazard, ensureReportHazard, loadDraft, saveDraft, publish, retry, escalate, cancel }
}
