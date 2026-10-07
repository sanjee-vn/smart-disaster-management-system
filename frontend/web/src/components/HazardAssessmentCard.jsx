import { Activity, AlertTriangle, Clock3, Radio } from 'lucide-react'
import { formatEnumLabel } from '../utils/responseOperationsRoutes'
import StatusBadge from './StatusBadge'

const formatObservation = (value) => new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(value))

export default function HazardAssessmentCard({ warning, incident, incidentError, evidence }) {
  return (
    <section className="warning-card assessment-card">
      <div className="warning-card-heading"><span className="warning-card-icon"><Activity size={18} /></span><div><h2>Hazard Assessment</h2><p>Current operational impact and observation evidence.</p></div></div>
      {incident ? (
        <dl className="warning-details assessment-details">
          <div><dt>Hazard type</dt><dd>{incident.hazardType}</dd></div>
          <div><dt>District</dt><dd>{incident.district}</dd></div>
          <div><dt>Affected area</dt><dd>{incident.affectedArea || warning.targetArea}</dd></div>
          <div><dt>Affected population</dt><dd>{incident.affectedPopulation?.toLocaleString() ?? 'Not available'}</dd></div>
          <div><dt>Current severity</dt><dd><StatusBadge value={incident.severity} kind="severity" /></dd></div>
          <div><dt>Incident status</dt><dd>{formatEnumLabel(incident.status)}</dd></div>
        </dl>
      ) : (
        <div className="linked-incident-empty"><AlertTriangle size={18} /><div><strong>No linked incident is available.</strong><p>{incidentError || 'This warning has not yet been linked to an incident.'}</p></div></div>
      )}
      <div className="evidence-panel" aria-label="Presentation-only demo evidence">
        <div className="demo-label">Demo assessment context</div>
        <div><Radio size={15} /><span><b>Evidence source</b>{evidence.source}</span></div>
        <div><AlertTriangle size={15} /><span><b>Situation summary</b>{evidence.summary}</span></div>
        <div><Clock3 size={15} /><span><b>Observed at</b>{formatObservation(evidence.observedAt)}</span></div>
      </div>
    </section>
  )
}
