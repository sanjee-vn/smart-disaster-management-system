import { X } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function SelectedTeamsSummary({ teams, onRemove }) {
  return <aside className="team-selection-card selected-teams-summary"><div className="team-card-heading"><div><h2>Selected Teams: {teams.length}</h2><p>Teams included in the assignment draft.</p></div></div>{teams.length === 0 ? <div className="team-empty"><strong>No teams selected</strong><p>Select one or more available teams from the list.</p></div> : <div className="selected-team-list">{teams.map((team) => <div key={team.id}><div><strong>{team.name}</strong><span>{team.agency?.name || 'Unknown agency'} · {team.type}</span><StatusBadge value={team.status} /></div><button type="button" aria-label={`Remove ${team.name}`} onClick={() => onRemove(team.id)}><X size={14} /></button></div>)}</div>}</aside>
}
