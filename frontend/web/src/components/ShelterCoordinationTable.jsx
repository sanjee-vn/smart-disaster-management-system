import StatusBadge from './StatusBadge'

const getOccupancyState = (occupancy, capacity) => {
  if (!capacity) return { label: 'Not available', className: 'unknown' }
  const percentage = occupancy / capacity * 100
  if (percentage >= 100) return { label: 'Full', className: 'full' }
  if (percentage >= 85) return { label: 'Near Capacity', className: 'near' }
  return { label: 'Normal', className: 'normal' }
}

export default function ShelterCoordinationTable({ shelters, selectedId, onSelect }) {
  return <div className="table-wrap"><table className="response-table shelter-coordination-table"><thead><tr><th>Select</th><th>Shelter</th><th>Location</th><th>Status</th><th>Occupancy</th><th>Available</th><th>Utilization</th><th>Pending Requests</th><th>Incoming</th></tr></thead><tbody>{shelters.map((shelter) => {
    const occupancy = Number(shelter.occupancy) || 0
    const capacity = Number(shelter.capacity) || 0
    const available = Math.max(0, capacity - occupancy)
    const percentage = capacity > 0 ? Math.round(occupancy / capacity * 100) : 0
    const occupancyState = getOccupancyState(occupancy, capacity)
    return <tr key={shelter.id} className={selectedId === shelter.id ? 'selected-shelter-row' : ''} onClick={() => onSelect(shelter)}><td><input type="radio" name="selectedShelter" aria-label={`Select ${shelter.name}`} checked={selectedId === shelter.id} onChange={() => onSelect(shelter)} /></td><td><strong>{shelter.name || 'Unnamed shelter'}</strong><small>{shelter.shelterId || 'Public ID unavailable'}</small></td><td>{shelter.district || 'Not available'}</td><td><StatusBadge value={shelter.status || 'UNKNOWN'} /></td><td>{occupancy.toLocaleString()} / {capacity.toLocaleString()}</td><td>{available.toLocaleString()}</td><td><div className="shelter-utilization"><div><span style={{ width: `${Math.min(100, percentage)}%` }} /></div><small>{percentage}% · <b className={occupancyState.className}>{occupancyState.label}</b></small></div></td><td>{shelter.pendingRequests?.length || 0}</td><td>{shelter.incomingResources?.length || 0}</td></tr>
  })}</tbody></table></div>
}
