import { BellRing } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not available'

export default function LinkedWarningCard({ warning }) {
  return <section className="planning-card linked-warning-planning"><div className="planning-card-heading"><span><BellRing size={18} /></span><div><h2>Linked Warning</h2><p>Official warning associated with this incident.</p></div></div>{!warning ? <div className="planning-empty">No linked official warning.</div> : <dl className="planning-details"><div><dt>Warning ID</dt><dd>{warning.warningId}</dd></div><div><dt>Status</dt><dd><StatusBadge value={warning.status} /></dd></div><div><dt>Severity</dt><dd><StatusBadge value={warning.severity} kind="severity" /></dd></div><div><dt>Target area</dt><dd>{warning.targetArea}</dd></div><div><dt>Issued by</dt><dd>{warning.issuedBy || 'Not available'}</dd></div><div><dt>Issued at</dt><dd>{formatDateTime(warning.issuedAt)}</dd></div><div className="planning-wide-detail"><dt>Warning message</dt><dd>{warning.message || 'No warning message recorded.'}</dd></div></dl>}</section>
}
