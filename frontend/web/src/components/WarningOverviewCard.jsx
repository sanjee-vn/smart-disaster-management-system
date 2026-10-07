import { BellRing } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not available'

export default function WarningOverviewCard({ warning }) {
  return (
    <section className="warning-card">
      <div className="warning-card-heading"><span className="warning-card-icon"><BellRing size={18} /></span><div><h2>Warning Overview</h2><p>Verified warning record from response operations.</p></div></div>
      <dl className="warning-details">
        <div><dt>Warning ID</dt><dd>{warning.warningId}</dd></div>
        <div><dt>Hazard type</dt><dd>{warning.hazardType}</dd></div>
        <div><dt>Current severity</dt><dd><StatusBadge value={warning.severity} kind="severity" /></dd></div>
        <div><dt>District</dt><dd>{warning.district}</dd></div>
        <div><dt>Target area</dt><dd>{warning.targetArea}</dd></div>
        <div><dt>Status</dt><dd><StatusBadge value={warning.status} /></dd></div>
        <div><dt>Issued by</dt><dd>{warning.issuedBy || 'Not available'}</dd></div>
        <div><dt>Issued at</dt><dd>{formatDateTime(warning.issuedAt)}</dd></div>
      </dl>
    </section>
  )
}
