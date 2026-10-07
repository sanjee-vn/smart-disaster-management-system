import { ArrowLeft, Building2 } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'

export default function ShelterCoordinationPlaceholder() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const context = state?.responseContext?.incidentId === incidentId ? state.responseContext : null
  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Shelter & Evacuation Coordination" role="Response Officer"><div className="content"><div className="state shelter-coordination-placeholder"><Building2 size={32} /><h1>Shelter &amp; Evacuation Coordination</h1><p>This workflow step will be implemented next.</p><p className="draft-summary">Incident ID: {incidentId}</p>{context && <div className="shelter-placeholder-summary"><div><span>Response ID</span><strong>{context.responseId || 'No team assignment'}</strong></div><div><span>Response status</span><strong><StatusBadge value={context.responseStatus} /></strong></div><div><span>Deployed teams</span><strong>{context.deployedTeamCount}</strong></div></div>}<button className="btn btn-secondary" onClick={() => navigate('/response-operations')}><ArrowLeft size={14} /> Back to Response Operations</button></div></div></DashboardLayout>
}
