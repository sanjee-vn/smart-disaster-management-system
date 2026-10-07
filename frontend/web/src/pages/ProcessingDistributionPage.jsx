import { AlertTriangle, Circle, Clock3 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import { getResponseOperationsPaths } from '../utils/responseOperationsRoutes'

const processingSteps = [
  'Checking latest inventory availability',
  'Checking delivery resource availability',
  'Creating distribution record',
  'Updating central inventory',
  'Updating shelter incoming resources',
]

export default function ProcessingDistributionPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incidentId: routeIncidentId } = useParams()
  const draft = state?.draft
  const paths = getResponseOperationsPaths(routeIncidentId || draft?.incidentId)

  if (!draft) return <DashboardLayout><div className="content"><div className="state"><AlertTriangle size={26} /><h3>No distribution draft is available.</h3><p>Return to Resource Coordination and prepare a distribution first.</p><button className="btn btn-primary" onClick={() => navigate(paths.dashboard)}>Return to Resource Coordination</button></div></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="content processing-page">
        <div className="processing-heading"><div className="processing-icon pending"><Clock3 size={29} /></div><h1>Processing & Validation</h1><p>This workflow step is prepared for the integrated emergency-response transaction.</p></div>
        <section className="processing-card">
          <div className="processing-reference"><div><span>Incident</span><strong>{draft.incidentId || 'Standalone'}</strong></div><div><span>Destination</span><strong>{draft.shelterName}</strong></div><div><span>Distribution</span><strong>{draft.quantity} {draft.unit} · {draft.itemName}</strong></div></div>
          <div className="processing-steps">{processingSteps.map((step) => <div className="processing-step stopped" key={step}><span className="step-state"><Circle size={17} /></span><span>{step}</span></div>)}</div>
          <div className="processing-notice"><AlertTriangle size={17} /><div><strong>Processing is not enabled in this integration step.</strong><p>No distribution, inventory, shelter, or delivery-resource data has been changed.</p></div></div>
        </section>
        <div className="processing-actions"><button className="btn cancel-btn" onClick={() => navigate(paths.dashboard)}>Return to Resource Coordination</button></div>
      </div>
    </DashboardLayout>
  )
}
