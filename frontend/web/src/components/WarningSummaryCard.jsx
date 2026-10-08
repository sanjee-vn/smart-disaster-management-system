import { ClipboardCheck } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function WarningSummaryCard({ warning, incident }) {
  const items = [
    ['Hazard', warning.hazardType],
    ['Severity', <StatusBadge key="severity" value={warning.severity} kind="severity" />],
    ['Target area', warning.targetArea],
    ['Warning status', <StatusBadge key="status" value={warning.status} />],
    ['Affected population', incident?.affectedPopulation?.toLocaleString() ?? 'Not available'],
    ['Linked incident ID', incident?.incidentId || 'Not linked'],
  ]
  return (
    <section className="warning-card summary-card">
      <div className="warning-card-heading"><span className="warning-card-icon"><ClipboardCheck size={18} /></span><div><h2>Warning Summary</h2><p>At-a-glance operational review.</p></div></div>
      <div className="warning-summary-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    </section>
  )
}
