import { ShieldAlert } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))
  : 'Not available'

export default function IncidentOverviewCard({ incident }) {
  return <section className="planning-card incident-overview-card"><div className="planning-card-heading"><span><ShieldAlert size={18} /></span><div><h2>Incident Overview</h2><p>Verified operational incident facts.</p></div></div><dl className="planning-details"><div><dt>Incident ID</dt><dd>{incident.incidentId}</dd></div><div><dt>Hazard type</dt><dd>{incident.hazardType}</dd></div><div><dt>Severity</dt><dd><StatusBadge value={incident.severity} kind="severity" /></dd></div><div><dt>District</dt><dd>{incident.district}</dd></div><div><dt>Affected area</dt><dd>{incident.affectedArea || 'Not available'}</dd></div><div><dt>Affected population</dt><dd>{incident.affectedPopulation?.toLocaleString() || 'Not available'}</dd></div><div><dt>Incident status</dt><dd><StatusBadge value={incident.status} /></dd></div><div><dt>Created at</dt><dd>{formatDateTime(incident.createdAt)}</dd></div></dl></section>
}
