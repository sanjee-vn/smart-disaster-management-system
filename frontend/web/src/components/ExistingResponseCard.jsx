import { AlertTriangle, ClipboardList, RefreshCw } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not scheduled'

export default function ExistingResponseCard({ assignment, error, onRetry }) {
  return <section className="planning-card existing-response-card"><div className="planning-card-heading"><span><ClipboardList size={18} /></span><div><h2>Existing Response Context</h2><p>Read-only assignment information for planning awareness.</p></div></div>{error ? <div className="planning-inline-error"><AlertTriangle size={16} /><span>{error}</span><button className="back-link" onClick={onRetry}><RefreshCw size={12} /> Retry</button></div> : !assignment ? <div className="planning-empty">No response assignment is currently recorded for this incident.</div> : <dl className="planning-details"><div><dt>Response ID</dt><dd>{assignment.responseId}</dd></div><div><dt>Priority</dt><dd>{assignment.priority || 'Not set'}</dd></div><div><dt>Destination</dt><dd>{assignment.destination || 'Not set'}</dd></div><div><dt>Status</dt><dd><StatusBadge value={assignment.status} /></dd></div><div><dt>ETA</dt><dd>{formatDateTime(assignment.eta)}</dd></div><div><dt>Assigned teams</dt><dd>{assignment.teams.length}</dd></div></dl>}</section>
}
