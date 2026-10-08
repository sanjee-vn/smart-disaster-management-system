import { Building2, Clock3, ShieldAlert, Users } from 'lucide-react'

const cards = [
  { key: 'activeIncidents', label: 'Active Incidents', icon: ShieldAlert },
  { key: 'plannedResponses', label: 'Awaiting / Planned Response', icon: Clock3 },
  { key: 'availableTeams', label: 'Teams Available', icon: Users },
  { key: 'deployedTeams', label: 'Teams Deployed', icon: Users },
  { key: 'activeShelters', label: 'Active Shelters', icon: Building2 },
]

export default function ResponseSummaryCards({ metrics, errors }) {
  return <section className="response-summary-cards" aria-label="Operational summary">{cards.map(({ key, label, icon: Icon }) => {
    const errorKey = key === 'activeIncidents' ? 'incidents' : key === 'plannedResponses' ? 'assignments' : key === 'activeShelters' ? 'shelters' : 'teams'
    const unavailable = errorKey && errors[errorKey]
    return <article className="response-summary-card" key={key}><span className="response-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{unavailable ? '—' : metrics[key]}</strong><small>{unavailable ? 'Data unavailable' : 'Current operational data'}</small></div></article>
  })}</section>
}
