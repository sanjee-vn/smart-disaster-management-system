import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import ReviewSummary from '../components/ReviewSummary'
import useIncidentResponseContext from '../hooks/useIncidentResponseContext'
import { getDeliveryResourceById, getInventoryItemById, getShelterById } from '../services/resourceCoordinationService'
import { isDistributionValid, validateDistributionDraft } from '../utils/distributionValidation'
import { formatEnumLabel, getResponseOperationsPaths } from '../utils/responseOperationsRoutes'
import { saveProcessingDraft } from '../utils/distributionDraftStorage'

export default function ReviewDistributionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incidentId: routeIncidentId } = useParams()
  const draft = state?.draft && (!routeIncidentId || state.draft.incidentId === routeIncidentId) ? state.draft : null
  const incidentId = routeIncidentId || draft?.incidentId
  const paths = getResponseOperationsPaths(incidentId)
  const { context: responseContext, loading: contextLoading, error: contextError } = useIncidentResponseContext(draft ? incidentId : null)
  const [shelter, setShelter] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [deliveryResource, setDeliveryResource] = useState(null)
  const [missing, setMissing] = useState({ inventory: false, delivery: false })
  const [loading, setLoading] = useState(Boolean(draft))
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')

  const fetchLatest = async () => {
    const results = await Promise.allSettled([
      getShelterById(draft.shelterId),
      getInventoryItemById(draft.inventoryItemId),
      getDeliveryResourceById(draft.deliveryResourceId),
    ])
    const shelterResult = results[0]
    const inventoryResult = results[1]
    const deliveryResult = results[2]
    if (shelterResult.status === 'rejected') throw shelterResult.reason
    const nextInventory = inventoryResult.status === 'fulfilled' ? inventoryResult.value : null
    const nextDelivery = deliveryResult.status === 'fulfilled' ? deliveryResult.value : null
    const nextMissing = {
      inventory: inventoryResult.status === 'rejected' && inventoryResult.reason.response?.status === 404,
      delivery: deliveryResult.status === 'rejected' && deliveryResult.reason.response?.status === 404,
    }
    if (inventoryResult.status === 'rejected' && !nextMissing.inventory) throw inventoryResult.reason
    if (deliveryResult.status === 'rejected' && !nextMissing.delivery) throw deliveryResult.reason
    return { shelter: shelterResult.value, inventory: nextInventory, deliveryResource: nextDelivery, missing: nextMissing }
  }

  const applyLatest = (latest) => {
    setShelter(latest.shelter)
    setInventory(latest.inventory)
    setDeliveryResource(latest.deliveryResource)
    setMissing(latest.missing)
  }

  useEffect(() => {
    if (!draft) return
    let active = true
    fetchLatest()
      .then((latest) => { if (active) applyLatest(latest) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not revalidate this distribution.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
    // The draft is intentionally fixed for the lifetime of this route entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!draft) return <DashboardLayout><div className="content"><div className="state"><AlertTriangle size={26} /><h3>No distribution draft is available.</h3><p>Start from Resource Coordination to prepare a distribution.</p><button className="btn btn-primary" onClick={() => navigate(paths.dashboard)}>Return to Resource Coordination</button></div></div></DashboardLayout>
  if (loading || contextLoading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Revalidating distribution" /></div></DashboardLayout>
  if (error || contextError) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={26} /><h3>Unable to validate distribution</h3><p>{error || contextError}</p><button className="btn btn-secondary" onClick={() => navigate(paths.create(draft.shelterId), { state: { editDraft: draft } })}>Edit Distribution</button></div></div></DashboardLayout>

  const validation = validateDistributionDraft(draft, inventory, deliveryResource)
  const editDistribution = () => navigate(paths.create(draft.shelterId), { state: { editDraft: draft } })
  const confirm = async () => {
    setConfirming(true)
    setError('')
    try {
      const latest = await fetchLatest()
      applyLatest(latest)
      const latestValidation = validateDistributionDraft(draft, latest.inventory, latest.deliveryResource)
      if (!isDistributionValid(latestValidation)) return
      const validatedDraft = { ...draft, requestId: draft.requestId || crypto.randomUUID(), availableQuantity: latest.inventory.availableQuantity, unit: latest.inventory.unit, deliveryResourceStatus: latest.deliveryResource.status }
      saveProcessingDraft(validatedDraft)
      navigate(paths.processing, { state: { draft: validatedDraft } })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not complete the latest validation.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="content review-page">
        <button className="back-link" onClick={editDistribution}><ArrowLeft size={15} /> Edit Distribution</button>
        <div className="page-heading"><div><h1>Review Distribution</h1><p className="subtitle">Verify the latest stock and delivery availability before dispatch.</p></div><span className="draft-badge">Final review</span></div>

        <section className="response-context-strip">
          <div><span>Incident</span><strong>{draft.incidentId || 'Standalone distribution'}</strong></div>
          <div><span>Hazard</span><strong>{responseContext?.hazardType || 'Standalone'}</strong></div>
          <div><span>Severity</span><strong>{responseContext ? formatEnumLabel(responseContext.severity) : 'Not available'}</strong></div>
          <div><span>Selected shelter</span><strong>{draft.shelterName}</strong></div>
        </section>

        {missing.inventory && <div className="review-warning danger"><AlertTriangle size={20} /><div><strong>Inventory item is no longer available.</strong><p>Return to the form and select another inventory source.</p></div><button className="btn btn-secondary" onClick={editDistribution}>Adjust Quantity / Edit Distribution</button></div>}
        {!missing.inventory && !validation.quantityValid && <div className="review-warning danger"><AlertTriangle size={20} /><div><strong>Requested quantity is invalid.</strong><p>Quantity must be greater than zero.</p></div><button className="btn btn-secondary" onClick={editDistribution}>Adjust Quantity / Edit Distribution</button></div>}
        {!missing.inventory && validation.quantityValid && !validation.stockSufficient && <div className="review-warning danger"><AlertTriangle size={20} /><div><strong>Inventory has changed since this distribution was prepared.</strong><p>The requested quantity now exceeds current available stock.</p></div><button className="btn btn-secondary" onClick={editDistribution}>Adjust Quantity / Edit Distribution</button></div>}
        {(missing.delivery || !validation.deliveryResourceAvailable) && <div className="review-warning danger"><AlertTriangle size={20} /><div><strong>{missing.delivery ? 'Selected delivery resource no longer exists.' : 'Selected delivery resource is no longer available.'}</strong><p>Choose another available vehicle or team before continuing.</p></div><button className="btn btn-secondary" onClick={editDistribution}>Change Delivery Resource</button></div>}
        {isDistributionValid(validation) && <div className="review-warning success"><CheckCircle2 size={20} /><div><strong>Latest availability checks passed.</strong><p>Inventory and delivery resources are currently available.</p></div></div>}

        <ReviewSummary draft={draft} shelter={shelter} inventory={inventory} deliveryResource={deliveryResource} remainingStock={validation.remainingStock} />

        <div className="review-actions"><button className="btn cancel-btn" onClick={editDistribution}>Edit Distribution</button><div><span>A final availability check will run before continuing</span><button className="btn continue-btn" disabled={!isDistributionValid(validation) || confirming} onClick={confirm}>{confirming ? <><RefreshCw size={15} className="spin" /> Revalidating…</> : 'Confirm & Dispatch'}</button></div></div>
      </div>
    </DashboardLayout>
  )
}
