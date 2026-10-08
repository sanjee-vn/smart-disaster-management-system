import { ArrowRight, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function ActiveIncidentsTable({ incidents, assignments, error, assignmentError, entryArea = 'planning' }) {
  const navigate = useNavigate()
  const actionFor = (incidentId) => entryArea === 'resources'
    ? { label: 'Open Resource Allocation', to: `/response-operations/incidents/${incidentId}/resources` }
    : entryArea === 'monitoring'
      ? { label: 'Open Response Monitoring', to: `/response-operations/incidents/${incidentId}/monitoring` }
      : { label: 'View / Plan Response', to: `/response-operations/incidents/${incidentId}` }
  return (
    <section className="response-panel active-incidents-panel">
      <div className="response-panel-heading"><div><h2>Active Incidents</h2><p>Warnings requiring coordinated emergency response.</p></div><span>{incidents.length} incident{incidents.length === 1 ? '' : 's'}</span></div>
      {error && <div className="response-inline-state error"><ShieldAlert size={18} /><div><strong>Incident data unavailable</strong><p>{error}</p></div></div>}
      {!error && incidents.length === 0 && <div className="response-inline-state"><ShieldAlert size={18} /><div><strong>No active incidents</strong><p>No emergency-response incidents currently require coordination.</p></div></div>}
      {!error && incidents.length > 0 && <div className="table-wrap"><table className="response-table"><thead><tr><th>Incident ID</th><th>Warning ID</th><th>Hazard</th><th>District</th><th>Severity</th><th>Affected Population</th><th>Incident Status</th><th>Response Status</th><th>Action</th></tr></thead><tbody>{incidents.map((incident) => {
        const assignment = assignments.find((item) => item.incident?.incidentId === incident.incidentId)
        const action = actionFor(incident.incidentId)
        return <tr key={incident.incidentId}><td className="resource-name">{incident.incidentId}</td><td>{incident.warning?.warningId || 'Not linked'}</td><td>{incident.hazardType}</td><td>{incident.district}</td><td><StatusBadge value={incident.severity} kind="severity" /></td><td>{incident.affectedPopulation?.toLocaleString() || 'Not available'}</td><td><StatusBadge value={incident.status} /></td><td><StatusBadge value={assignmentError ? 'DATA_UNAVAILABLE' : assignment?.status || 'NOT_PLANNED'} /></td><td><button className="btn response-row-action" onClick={() => navigate(action.to)}>{action.label} <ArrowRight size={12} /></button></td></tr>
      })}</tbody></table></div>}
    </section>
  )
}
