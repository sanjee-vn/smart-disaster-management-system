import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function LinkedIncidentCard({ incident, error, onRetry }) {
  return (
    <section className="warning-card linked-incident-card">
      <div className="warning-card-heading"><span className="warning-card-icon"><ShieldCheck size={18} /></span><div><h2>Linked Incident / Response Context</h2><p>Bridge from the official warning into emergency-response coordination.</p></div></div>
      {error && <div className="linked-incident-empty warning"><AlertTriangle size={17} /><div><strong>Linked incident information is unavailable</strong><p>{error}</p><button className="back-link incident-retry" onClick={onRetry}><RefreshCw size={12} /> Retry incident lookup</button></div></div>}
      {!error && !incident && <div className="linked-incident-empty"><AlertTriangle size={17} /><div><strong>No linked incident</strong><p>No emergency-response incident is currently linked to this warning.</p></div></div>}
      {!error && incident && <dl className="warning-details incident-status-details">
        <div><dt>Incident ID</dt><dd>{incident.incidentId}</dd></div><div><dt>Hazard type</dt><dd>{incident.hazardType}</dd></div>
        <div><dt>Severity</dt><dd><StatusBadge value={incident.severity} kind="severity" /></dd></div><div><dt>District</dt><dd>{incident.district}</dd></div>
        <div><dt>Affected area</dt><dd>{incident.affectedArea || 'Not available'}</dd></div><div><dt>Affected population</dt><dd>{incident.affectedPopulation?.toLocaleString() || 'Not available'}</dd></div>
        <div><dt>Incident status</dt><dd><StatusBadge value={incident.status} /></dd></div>
      </dl>}
    </section>
  )
}
