import { Activity } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

export default function ResponseMonitoringPlaceholder() {
  const { incidentId } = useParams()
  const navigate = useNavigate()
  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Live Monitoring" role="Response Officer"><div className="content"><div className="state"><Activity size={28} /><h3>Live Response Monitoring</h3><p>Monitoring for incident {incidentId} will be implemented in Page 14.</p><button className="btn btn-primary" onClick={() => navigate(`/response-operations/incidents/${incidentId}/resources`)}>Back to Resource Coordination</button></div></div></DashboardLayout>
}
