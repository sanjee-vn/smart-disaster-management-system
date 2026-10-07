import { ClipboardList } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not scheduled'

export default function CurrentAssignmentsPanel({ assignments, error }) {
  return <section className="response-panel assignments-panel"><div className="response-panel-heading"><div><h2>Current Assignments</h2><p>Planned and active response coordination records.</p></div><span>{assignments.length} assignment{assignments.length === 1 ? '' : 's'}</span></div>{error && <div className="response-inline-state error"><ClipboardList size={18} /><div><strong>Assignment data unavailable</strong><p>{error}</p></div></div>}{!error && assignments.length === 0 && <div className="response-inline-state"><ClipboardList size={18} /><div><strong>No response assignments</strong><p>No planned or active assignments are currently recorded.</p></div></div>}{!error && assignments.length > 0 && <div className="table-wrap"><table className="response-table"><thead><tr><th>Response ID</th><th>Incident ID</th><th>Priority</th><th>Destination</th><th>Status</th><th>ETA</th><th>Teams</th></tr></thead><tbody>{assignments.map((assignment) => <tr key={assignment.responseId}><td className="resource-name">{assignment.responseId}</td><td>{assignment.incident?.incidentId || 'Not available'}</td><td>{assignment.priority || 'Not set'}</td><td>{assignment.destination || 'Not set'}</td><td><StatusBadge value={assignment.status} /></td><td>{formatDateTime(assignment.eta)}</td><td>{assignment.teams.length}</td></tr>)}</tbody></table></div>}</section>
}
