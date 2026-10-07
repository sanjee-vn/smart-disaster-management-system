import { FileWarning } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not available'

export default function WarningDetailsCard({ warning }) {
  return (
    <section className="warning-card warning-status-details">
      <div className="warning-card-heading"><span className="warning-card-icon"><FileWarning size={18} /></span><div><h2>Warning Details</h2><p>Final persisted warning information.</p></div></div>
      <dl className="warning-details">
        <div><dt>Warning ID</dt><dd>{warning.warningId}</dd></div><div><dt>Hazard type</dt><dd>{warning.hazardType}</dd></div>
        <div><dt>Severity</dt><dd><StatusBadge value={warning.severity} kind="severity" /></dd></div><div><dt>District</dt><dd>{warning.district}</dd></div>
        <div><dt>Target area</dt><dd>{warning.targetArea}</dd></div><div><dt>Status</dt><dd><StatusBadge value={warning.status} /></dd></div>
        <div><dt>Issued by</dt><dd>{warning.issuedBy || 'Not available'}</dd></div><div><dt>Issued at</dt><dd>{formatDateTime(warning.issuedAt)}</dd></div>
        <div className="warning-message-detail"><dt>Warning message</dt><dd>{warning.message || 'No warning message recorded.'}</dd></div>
      </dl>
    </section>
  )
}
