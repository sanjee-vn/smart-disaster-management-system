import { ArrowRight, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import { requirementLabels } from '../utils/responseRequirements'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not scheduled'

export default function CurrentAssignmentsPanel({ assignments, error, entryArea = 'planning' }) {
  const navigate = useNavigate()
  return <section className="response-panel assignments-panel"><div className="response-panel-heading"><div><h2>Current Assignments</h2><p>Planned requirements and active response coordination records.</p></div><span>{assignments.length} assignment{assignments.length === 1 ? '' : 's'}</span></div>{error && <div className="response-inline-state error"><ClipboardList size={18} /><div><strong>Assignment data unavailable</strong><p>{error}</p></div></div>}{!error && assignments.length === 0 && <div className="response-inline-state"><ClipboardList size={18} /><div><strong>No response assignments</strong><p>No planned or active assignments are currently recorded.</p></div></div>}{!error && assignments.length > 0 && <div className="table-wrap"><table className="response-table"><thead><tr><th>Response ID</th><th>Incident ID</th><th>Priority</th><th>Requirements</th><th>Status</th><th>ETA</th><th>Teams</th><th>Action</th></tr></thead><tbody>{assignments.map((assignment) => {
        const incidentId = assignment.incident?.incidentId
        const monitoringAvailable = ['DISPATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(assignment.status)
        const action = entryArea === 'resources'
          ? { label: 'Resource Allocation', to: `/response-operations/incidents/${incidentId}/resources` }
          : entryArea === 'monitoring'
            ? { label: 'Live Monitoring', to: `/response-operations/incidents/${incidentId}/monitoring` }
            : monitoringAvailable
              ? { label: 'Live Monitoring', to: `/response-operations/incidents/${incidentId}/monitoring` }
              : { label: 'View / Plan', to: `/response-operations/incidents/${incidentId}` }
        const requirements = assignment.requiredCapabilities?.map((code) => requirementLabels[code] || code).join(', ')
        return <tr key={assignment.responseId}><td className="resource-name">{assignment.responseId}</td><td>{incidentId || 'Not available'}</td><td>{assignment.priority || 'Not set'}</td><td><span className="requirement-summary">{requirements || 'Not recorded'}</span></td><td><StatusBadge value={assignment.status} /></td><td>{formatDateTime(assignment.eta)}</td><td>{assignment.teams.length}</td><td>{incidentId && <button className="btn response-row-action" onClick={() => navigate(action.to)}>{action.label} <ArrowRight size={12} /></button>}</td></tr>
      })}</tbody></table></div>}</section>
}
