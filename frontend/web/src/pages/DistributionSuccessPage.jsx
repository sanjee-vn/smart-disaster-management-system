import { ArrowRight, Check, CheckCircle2, MapPin, PackageCheck, Truck } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { isCommittedDistribution, loadCommittedDistribution } from '../utils/distributionSuccessStorage'
import { getResponseOperationsPaths } from '../utils/responseOperationsRoutes'

const formatTimestamp = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString()
}

export default function DistributionSuccessPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incidentId: routeIncidentId } = useParams()
  const stateDistribution = isCommittedDistribution(state?.distribution) ? state.distribution : null
  const distribution = stateDistribution && (!routeIncidentId || stateDistribution.incidentId === routeIncidentId)
    ? stateDistribution
    : loadCommittedDistribution(routeIncidentId)
  const incidentId = routeIncidentId || distribution?.incidentId
  const paths = getResponseOperationsPaths(incidentId)

  if (!routeIncidentId && !distribution) return <DashboardLayout><div className="content"><div className="state"><PackageCheck size={27} /><h3>Distribution details unavailable</h3><p>No committed distribution result is available for this route.</p><button className="btn btn-primary" onClick={() => navigate(paths.dashboard)}>Back to Resource Coordination</button></div></div></DashboardLayout>
  if (!distribution) return <DashboardLayout><div className="content"><div className="state"><PackageCheck size={27} /><h3>Distribution details unavailable</h3><p>A committed distribution for incident {routeIncidentId} could not be recovered. No success details have been inferred.</p><button className="btn btn-primary" onClick={() => navigate(paths.dashboard)}>Back to Resource Coordination</button></div></div></DashboardLayout>

  return (
    <DashboardLayout activeSection="resources" breadcrumb="Resource Coordination / Distribution Success">
      <div className="content distribution-success-page">
        <header className="distribution-success-banner">
          <span className="success-banner-icon"><CheckCircle2 size={32} /></span>
          <div><p className="warning-eyebrow">Atomic commit completed</p><h1>Distribution successfully created</h1><p>The relief allocation is waiting for the assigned Staff Officer to accept the delivery.</p></div>
          <StatusBadge value={distribution.status} />
        </header>

        <section className="success-reference-card">
          <div><span>Distribution ID</span><strong>{distribution.distributionId}</strong></div>
          <div><span>Created</span><strong>{formatTimestamp(distribution.issuedAt || distribution.createdAt)}</strong></div>
          <div><span>Status</span><strong>{distribution.status}</strong></div>
        </section>

        <div className="success-detail-grid">
          <section className="success-detail-card"><div className="success-card-heading"><MapPin size={18} /><div><h2>Incident &amp; Destination</h2><p>Committed response context</p></div></div><dl><div><dt>Incident</dt><dd>{distribution.incidentId}</dd></div>{distribution.responseId && <div><dt>Response</dt><dd>{distribution.responseId}</dd></div>}{distribution.incident?.hazardType && <div><dt>Hazard</dt><dd>{distribution.incident.hazardType}</dd></div>}<div><dt>Shelter</dt><dd>{distribution.shelter?.name || 'Not returned'}</dd></div>{distribution.shelter?.shelterId && <div><dt>Shelter ID</dt><dd>{distribution.shelter.shelterId}</dd></div>}{(distribution.shelter?.district || distribution.incident?.district) && <div><dt>District</dt><dd>{distribution.shelter?.district || distribution.incident?.district}</dd></div>}</dl></section>

          <section className="success-detail-card"><div className="success-card-heading"><PackageCheck size={18} /><div><h2>Resource Allocation</h2><p>Inventory committed to this distribution</p></div></div><dl><div><dt>Item</dt><dd>{distribution.item?.itemName || 'Not returned'}</dd></div><div><dt>Quantity</dt><dd>{distribution.quantity.toLocaleString()} {distribution.item?.unit || ''}</dd></div>{distribution.item?.category && <div><dt>Category</dt><dd>{distribution.item.category}</dd></div>}<div><dt>Source</dt><dd>{distribution.resourceOwner?.name || 'Not returned'}</dd></div>{distribution.resourceOwner?.type && <div><dt>Owner type</dt><dd>{distribution.resourceOwner.type}</dd></div>}</dl></section>

          <section className="success-detail-card"><div className="success-card-heading"><Truck size={18} /><div><h2>Delivery</h2><p>Reserved transport details</p></div></div><dl><div><dt>Delivery resource</dt><dd>{distribution.deliveryResource?.name || 'Not returned'}</dd></div>{distribution.deliveryResource?.type && <div><dt>Resource type</dt><dd>{distribution.deliveryResource.type}</dd></div>}<div><dt>ETA</dt><dd>{formatTimestamp(distribution.eta)}</dd></div>{distribution.notes && <div><dt>Notes</dt><dd>{distribution.notes}</dd></div>}</dl></section>
        </div>

        <section className="commit-confirmation"><h2>Transaction confirmation</h2><div>{['Inventory has been allocated', 'Delivery resource has been reserved', 'Distribution record has been created', 'Shelter incoming resources have been updated'].map((message) => <span key={message}><Check size={14} />{message}</span>)}</div><p>Delivery is awaiting acceptance in the Staff mobile app. Web monitoring is read-only.</p></section>

        <div className="success-actions"><button className="btn cancel-btn" onClick={() => navigate(paths.dashboard)}>Back to Resource Coordination</button><button className="btn btn-secondary" onClick={() => navigate(paths.dashboard)}>Log Another Distribution</button><button className="btn continue-btn" onClick={() => navigate(`${paths.dashboard}?view=distributions`)}>View Distribution Monitoring <ArrowRight size={15} /></button></div>
      </div>
    </DashboardLayout>
  )
}
