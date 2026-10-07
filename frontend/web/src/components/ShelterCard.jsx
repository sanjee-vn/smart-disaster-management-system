import { MapPin } from 'lucide-react'

const slug = (value) => value.toLowerCase().replaceAll(' ', '-')

export default function ShelterCard({ shelter, selected, onSelect, onLogDistribution }) {
  const percentage = Math.min(Math.round((shelter.occupancy / shelter.capacity) * 100), 100)
  return (
    <article className={`shelter-card ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="card-title">
        <div><h3>{shelter.name}</h3><div className="district"><MapPin size={12} /> {shelter.district} District</div></div>
        <span className={`badge ${slug(shelter.status)}`}>{shelter.status}</span>
      </div>
      <div className="occupancy-row"><span>Current occupancy</span><strong>{shelter.occupancy} / {shelter.capacity} &nbsp; {percentage}%</strong></div>
      <div className="bar"><div className={`bar-fill ${percentage >= 85 ? 'warning' : ''}`} style={{ width: `${percentage}%` }} /></div>
      <div className="card-stats">
        <div className="card-stat"><span>Pending requests</span><strong>{shelter.pendingRequests.length}</strong></div>
        <div className="card-stat"><span>Incoming resources</span><strong>{shelter.incomingResources.length}</strong></div>
      </div>
      <div className="card-actions">
        <button className="btn btn-secondary" onClick={(event) => { event.stopPropagation(); onSelect() }}>View Shelter</button>
        <button className="btn btn-primary" onClick={(event) => { event.stopPropagation(); onLogDistribution() }}>Log New Distribution</button>
      </div>
    </article>
  )
}
