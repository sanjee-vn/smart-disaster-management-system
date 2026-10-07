import { MapPin } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function TargetAreaPanel({ warning, incident }) {
  return (
    <section className="warning-card target-card">
      <div className="warning-card-heading"><span className="warning-card-icon"><MapPin size={18} /></span><div><h2>Target Area</h2><p>Geographic scope of the warning.</p></div></div>
      <div className="target-facts"><div><span>Target area</span><strong>{warning.targetArea}</strong></div><div><span>District</span><strong>{warning.district}</strong></div><div><span>Affected area</span><strong>{incident?.affectedArea || 'Not confirmed'}</strong></div><div><span>Severity</span><StatusBadge value={warning.severity} kind="severity" /></div></div>
      <div className="warning-map" role="img" aria-label={`Map placeholder for ${warning.targetArea}`}><div className="warning-map-river" /><div className="warning-map-road" /><div className="warning-map-pin"><MapPin size={17} /></div><div className="warning-map-label"><strong>{warning.targetArea}</strong><span>{warning.district} District</span></div></div>
    </section>
  )
}
