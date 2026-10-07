import { Building2, Clock3, RadioTower, ShieldAlert, Users } from 'lucide-react'

const cards = [
  { key: 'activeIncidents', label: 'Active Incidents', icon: ShieldAlert },
  { key: 'plannedResponses', label: 'Awaiting / Planned Response', icon: Clock3 },
  { key: 'deployedTeams', label: 'Teams Deployed', icon: Users },
  { key: 'activeShelters', label: 'Active Shelters', icon: Building2 },
  { key: 'resourcesEnRoute', label: 'Resources En Route', icon: RadioTower },
]

export default function ResponseSummaryCards({ metrics, errors }) {
  return <section className="response-summary-cards" aria-label="Operational summary">{cards.map(({ key, label, icon: Icon }) => {
    const errorKey = key === 'activeIncidents' ? 'incidents' : key === 'plannedResponses' ? 'assignments' : key === 'deployedTeams' ? 'teams' : key === 'activeShelters' ? 'shelters' : null
    const unavailable = errorKey && errors[errorKey]
    return <article className="response-summary-card" key={key}><span className="response-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{unavailable ? '—' : metrics[key]}</strong><small>{unavailable ? 'Data unavailable' : key === 'resourcesEnRoute' ? 'No distribution feed yet' : 'Current operational data'}</small></div></article>
  })}</section>
}
