import { ArrowRight, Boxes, Building2, PackageCheck, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { getResourceRequirements, loadPlanningRequirements, requirementLabels } from '../utils/responseRequirements'

const Metric = ({ icon: Icon, label, value, note }) => <article className="response-summary-card"><span className="response-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>

const requirementText = (assignment, incidentId) => {
  const persisted = getResourceRequirements(assignment?.requiredCapabilities)
  const requirements = persisted.length ? persisted : getResourceRequirements(loadPlanningRequirements(incidentId))
  return requirements.length ? requirements.map((code) => requirementLabels[code]).join(', ') : 'No consumable requirement recorded'
}

export default function ResourceAllocationDashboardContent({ incidents = [], assignments = [], shelters = [], distributions = [], inventory = [], deliveryResources = [], errors = {} }) {
  const navigate = useNavigate()
  const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED')
  const pendingRequests = shelters.reduce((total, shelter) => total + (shelter.pendingRequests?.length || 0), 0)
  const enRoute = distributions.filter((distribution) => distribution.status === 'EN_ROUTE').length
  const delivered = distributions.filter((distribution) => distribution.status === 'DELIVERED').length
  const availableDelivery = deliveryResources.filter((resource) => resource.status === 'AVAILABLE').length
  const inventoryByCategory = ['Food', 'Water', 'Medicine'].map((category) => {
    const items = inventory.filter((item) => item.category === category)
    const units = [...new Set(items.map((item) => item.unit))]
    return { category, records: items.length, quantity: items.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0), unit: units.length === 1 ? units[0] : 'mixed units' }
  })

  return <>
    <section className="response-summary-cards resource-allocation-metrics" aria-label="Resource allocation summary">
      <Metric icon={Building2} label="Incident Shelters" value={errors.shelters ? '—' : shelters.length} note="Across active operations" />
      <Metric icon={PackageCheck} label="Pending Shelter Needs" value={errors.shelters ? '—' : pendingRequests} note="Requests awaiting fulfilment" />
      <Metric icon={Boxes} label="Inventory Records" value={errors.inventory ? '—' : inventory.length} note="Available source records" />
      <Metric icon={Truck} label="Delivery Resources" value={errors.deliveryResources ? '—' : availableDelivery} note="Currently available" />
      <Metric icon={Truck} label="Distributions En Route" value={errors.distributions ? '—' : enRoute} note={`${delivered} delivered`} />
    </section>

    <section className="response-panel resource-incident-panel"><div className="response-panel-heading"><div><h2>Incidents Requiring Resource Coordination</h2><p>Planning requirements are read-only context for shelter-specific fulfilment.</p></div><span>{activeIncidents.length} active</span></div>{errors.incidents ? <div className="response-inline-state error">{errors.incidents}</div> : activeIncidents.length === 0 ? <div className="response-inline-state">No active incidents require resource coordination.</div> : <div className="table-wrap"><table className="response-table"><thead><tr><th>Incident</th><th>District</th><th>Severity</th><th>Planned Resource Requirements</th><th>Shelters</th><th>Pending Needs</th><th>Distributions</th><th>Action</th></tr></thead><tbody>{activeIncidents.map((incident) => {
      const assignment = assignments.find((item) => item.incident?.incidentId === incident.incidentId)
      const incidentShelters = shelters.filter((shelter) => shelter.incidentId === incident.incidentId)
      const incidentDistributions = distributions.filter((distribution) => distribution.incidentId === incident.incidentId)
      return <tr key={incident.incidentId}><td className="resource-name">{incident.incidentId}</td><td>{incident.district}</td><td><StatusBadge value={incident.severity} kind="severity" /></td><td><span className="requirement-summary">{requirementText(assignment, incident.incidentId)}</span></td><td>{incidentShelters.length}</td><td>{incidentShelters.reduce((sum, shelter) => sum + (shelter.pendingRequests?.length || 0), 0)}</td><td>{incidentDistributions.filter((item) => item.status === 'EN_ROUTE').length} en route · {incidentDistributions.filter((item) => item.status === 'DELIVERED').length} delivered</td><td><button className="btn response-row-action" onClick={() => navigate(`/response-operations/incidents/${incident.incidentId}/resources`)}>Open Resource Allocation <ArrowRight size={12} /></button></td></tr>
    })}</tbody></table></div>}</section>

    <div className="resource-dashboard-grid">
      <section className="response-panel"><div className="response-panel-heading"><div><h2>Available Inventory Overview</h2><p>Current stock records grouped by fulfilment category.</p></div></div>{errors.inventory ? <div className="response-inline-state error">{errors.inventory}</div> : <div className="resource-overview-list">{inventoryByCategory.map((entry) => <article key={entry.category}><div><strong>{entry.category}</strong><span>{entry.records} source record{entry.records === 1 ? '' : 's'}</span></div><b>{entry.quantity.toLocaleString()} <small>{entry.unit}</small></b></article>)}</div>}</section>
      <section className="response-panel"><div className="response-panel-heading"><div><h2>Delivery Resource Readiness</h2><p>Transport availability for new distributions.</p></div></div>{errors.deliveryResources ? <div className="response-inline-state error">{errors.deliveryResources}</div> : <div className="resource-overview-list"><article><div><strong>Available</strong><span>Ready for allocation</span></div><b>{availableDelivery}</b></article><article><div><strong>In Use</strong><span>Assigned to active delivery</span></div><b>{deliveryResources.filter((resource) => resource.status === 'IN_USE').length}</b></article></div>}</section>
    </div>

    <section className="response-panel resource-distribution-panel"><div className="response-panel-heading"><div><h2>Current Distributions</h2><p>Read-only incident delivery overview; completion occurs inside incident Resource Allocation.</p></div><span>{distributions.length} total</span></div>{errors.distributions ? <div className="response-inline-state error">{errors.distributions}</div> : distributions.length === 0 ? <div className="response-inline-state">No distributions have been committed.</div> : <div className="table-wrap"><table className="response-table"><thead><tr><th>Distribution</th><th>Incident</th><th>Shelter</th><th>Resource</th><th>Quantity</th><th>Delivery</th><th>Status</th></tr></thead><tbody>{distributions.map((distribution) => <tr key={distribution.id}><td className="resource-name">{distribution.distributionId}</td><td>{distribution.incidentId}</td><td>{distribution.shelter?.name || 'Not available'}</td><td>{distribution.item?.itemName || 'Not available'}</td><td>{distribution.quantity} {distribution.item?.unit || ''}</td><td>{distribution.deliveryResource?.name || 'Not available'}</td><td><StatusBadge value={distribution.status} /></td></tr>)}</tbody></table></div>}</section>
  </>
}
