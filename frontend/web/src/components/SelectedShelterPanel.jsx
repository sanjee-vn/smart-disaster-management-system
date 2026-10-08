import { ArrowRight, PackagePlus } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function SelectedShelterPanel({ shelter, onCoordinateResources, onLogDistribution }) {
  if (!shelter) return <section className="selected-shelter-panel empty"><h2>Select a shelter</h2><p>Choose one shelter to continue with resource coordination or distribution planning.</p></section>
  const occupancy = Number(shelter.occupancy) || 0
  const capacity = Number(shelter.capacity) || 0
  const available = Math.max(0, capacity - occupancy)
  return <section className="selected-shelter-panel"><div className="selected-shelter-heading"><div><span>Selected Shelter</span><h2>{shelter.name || 'Unnamed shelter'}</h2><p>{shelter.shelterId || 'Public ID unavailable'} · {shelter.district || 'Location unavailable'}</p></div><StatusBadge value={shelter.status || 'UNKNOWN'} /></div><div className="selected-shelter-facts"><div><span>Occupancy</span><strong>{occupancy.toLocaleString()} / {capacity.toLocaleString()}</strong></div><div><span>Available spaces</span><strong>{available.toLocaleString()}</strong></div><div><span>Pending requests</span><strong>{shelter.pendingRequests?.length || 0}</strong></div><div><span>Incoming resources</span><strong>{shelter.incomingResources?.length || 0}</strong></div></div><div className="selected-shelter-actions"><button className="btn cancel-btn" onClick={onLogDistribution}><PackagePlus size={14} /> Log Distribution</button><button className="btn continue-btn" onClick={onCoordinateResources}>Coordinate Resources <ArrowRight size={15} /></button></div></section>
}
