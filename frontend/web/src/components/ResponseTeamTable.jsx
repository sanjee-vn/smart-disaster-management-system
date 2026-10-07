import { Users } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function ResponseTeamTable({ teams, selectedIds, recommendedIds, onToggle, error }) {
  return <section className="team-selection-card response-team-panel"><div className="team-card-heading"><span><Users size={18} /></span><div><h2>Response Teams</h2><p>Only teams marked AVAILABLE can be selected.</p></div><b>{teams.length} shown</b></div>{error ? <div className="team-empty error"><strong>Response teams unavailable</strong><p>{error}</p></div> : teams.length === 0 ? <div className="team-empty"><strong>No teams match these filters</strong><p>Adjust the agency, type, or availability filter.</p></div> : <div className="table-wrap"><table className="response-table team-table"><thead><tr><th>Select</th><th>Team</th><th>Agency</th><th>Type</th><th>Current Location</th><th>Capacity</th><th>Status</th></tr></thead><tbody>{teams.map((team) => {
    const available = team.status === 'AVAILABLE'
    const selected = selectedIds.includes(team.id)
    return <tr key={team.id} className={!available ? 'team-disabled' : selected ? 'team-selected' : ''}><td><input type="checkbox" aria-label={`Select ${team.name}`} checked={selected} disabled={!available} onChange={() => onToggle(team)} /></td><td className="resource-name">{team.name}{recommendedIds.has(team.id) && <span className="recommended-team">Recommended</span>}</td><td>{team.agency?.name || 'Not available'}</td><td>{team.type}</td><td>{team.currentLocation || 'Not available'}</td><td>{team.capacity ?? 'Not available'}</td><td><StatusBadge value={team.status} /></td></tr>
  })}</tbody></table></div>}</section>
}
