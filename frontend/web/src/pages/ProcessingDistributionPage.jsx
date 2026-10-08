import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Circle, Clock3, LoaderCircle } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { commitDistribution } from '../services/resourceCoordinationService'
import { clearProcessingDraft, loadProcessingDraft } from '../utils/distributionDraftStorage'
import { saveCommittedDistribution } from '../utils/distributionSuccessStorage'
import { getResponseOperationsPaths } from '../utils/responseOperationsRoutes'

const processingSteps = [
  'Checking incident, shelter, and response context',
  'Conditionally reserving inventory',
  'Conditionally reserving the delivery resource',
  'Creating the distribution record',
  'Updating shelter incoming resources',
]

const errorGuidance = {
  INSUFFICIENT_STOCK: { title: 'Available stock has changed', message: 'The requested quantity is no longer available. Return to Review or edit the distribution quantity.' },
  INVENTORY_CONFLICT: { title: 'Inventory changed during processing', message: 'Another allocation changed this stock. Return to Review to load the latest availability.' },
  DELIVERY_RESOURCE_UNAVAILABLE: { title: 'Delivery resource is no longer available', message: 'Return to the distribution form and select another available vehicle or delivery team.' },
  DELIVERY_RESOURCE_CONFLICT: { title: 'Delivery resource changed during processing', message: 'Another operation reserved this resource. Return to the form and select another one.' },
  TRANSACTION_UNAVAILABLE: { title: 'Atomic processing is unavailable', message: 'MongoDB transaction support is required. Nothing was committed and your draft has been kept.' },
}

const getApiError = (requestError) => {
  const body = requestError.response?.data
  const code = body?.error?.code || body?.code || 'DISTRIBUTION_COMMIT_FAILED'
  const fallback = body?.error?.message || body?.message || 'The distribution could not be committed. No success record was created.'
  return { code, ...(errorGuidance[code] || { title: 'Distribution processing failed', message: fallback }) }
}

export default function ProcessingDistributionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incidentId: routeIncidentId } = useParams()
  const [draft] = useState(() => {
    const stateDraft = state?.draft
    return stateDraft && (!routeIncidentId || stateDraft.incidentId === routeIncidentId) ? stateDraft : loadProcessingDraft(routeIncidentId)
  })
  const incidentId = routeIncidentId || draft?.incidentId
  const paths = getResponseOperationsPaths(incidentId)
  const [status, setStatus] = useState('processing')
  const [failure, setFailure] = useState(null)
  const submitting = useRef(false)

  const processDistribution = useCallback(async () => {
    if (!draft || submitting.current) return
    submitting.current = true
    setStatus('processing')
    setFailure(null)
    try {
      const distribution = await commitDistribution({
        requestId: draft.requestId,
        incidentId: draft.incidentId,
        responseId: draft.responseId || undefined,
        shelterId: draft.shelterId,
        inventoryItemId: draft.inventoryItemId,
        resourceOwnerId: draft.resourceOwnerId,
        deliveryResourceId: draft.deliveryResourceId,
        quantity: draft.quantity,
        eta: draft.eta || undefined,
        notes: draft.notes || undefined,
      })
      saveCommittedDistribution(distribution)
      clearProcessingDraft(draft.incidentId)
      setStatus('committed')
      navigate(paths.success, { replace: true, state: { distribution } })
    } catch (requestError) {
      setFailure(getApiError(requestError))
      setStatus('failed')
      submitting.current = false
    }
  }, [draft, navigate, paths.success])

  useEffect(() => {
    queueMicrotask(processDistribution)
  }, [processDistribution])

  if (!draft) return <DashboardLayout><div className="content"><div className="state"><AlertTriangle size={26} /><h3>No distribution draft is available.</h3><p>Return to Resource Coordination and prepare a distribution first.</p><button className="btn btn-primary" onClick={() => navigate(paths.dashboard)}>Return to Resource Coordination</button></div></div></DashboardLayout>

  const editDistribution = () => navigate(paths.create(draft.shelterId), { state: { editDraft: draft } })
  const reviewDistribution = () => navigate(paths.review, { state: { draft } })

  return (
    <DashboardLayout>
      <div className="content processing-page">
        <div className="processing-heading">
          <div className={`processing-icon ${status}`}>{status === 'processing' ? <LoaderCircle size={29} className="spin" /> : status === 'committed' ? <CheckCircle2 size={29} /> : <AlertTriangle size={29} />}</div>
          <h1>{status === 'processing' ? 'Processing distribution…' : 'Distribution not committed'}</h1>
          <p>{status === 'processing' ? 'Inventory, transport, and shelter updates are being committed as one atomic operation.' : 'The atomic operation did not complete. No success state has been recorded.'}</p>
        </div>
        <section className="processing-card">
          <div className="processing-reference"><div><span>Incident / response</span><strong>{draft.incidentId || 'Not available'} · {draft.responseId || 'No response assignment'}</strong></div><div><span>Destination</span><strong>{draft.shelterName}</strong></div><div><span>Distribution</span><strong>{draft.quantity} {draft.unit} · {draft.itemName}</strong></div></div>
          <div className="processing-detail-grid"><div><span>Resource owner</span><strong>{draft.resourceOwnerName}</strong></div><div><span>Delivery resource</span><strong>{draft.deliveryResourceName}</strong></div><div><span>ETA</span><strong>{draft.eta ? new Date(draft.eta).toLocaleString() : 'Not specified'}</strong></div></div>
          <div className="processing-steps">{processingSteps.map((step) => <div className={`processing-step ${status}`} key={step}><span className="step-state">{status === 'processing' ? <Clock3 size={17} /> : status === 'committed' ? <CheckCircle2 size={17} /> : <Circle size={17} />}</span><span>{step}</span></div>)}</div>
          {failure && <div className="processing-error" role="alert"><AlertTriangle size={18} /><div><strong>{failure.title}</strong><p>{failure.message}</p><small>Error code: {failure.code}</small></div></div>}
        </section>
        {status === 'failed' && <div className="processing-actions"><button className="btn cancel-btn" onClick={editDistribution}>Edit Distribution</button><button className="btn btn-secondary" onClick={reviewDistribution}>Back to Review</button><button className="btn continue-btn" onClick={processDistribution}>Try Atomic Commit Again</button></div>}
      </div>
    </DashboardLayout>
  )
}
