import { Building2, Clock3, ShieldAlert, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const cards = [
  { key: 'activeIncidents', label: 'Active Incidents', icon: ShieldAlert },
  { key: 'plannedResponses', label: 'Awaiting / Planned Response', icon: Clock3 },
  { key: 'availableTeams', label: 'Teams Available', icon: Users },
  { key: 'deployedTeams', label: 'Teams Deployed', icon: Users },
  { key: 'activeShelters', label: 'Active Shelters', icon: Building2 },
  { key: 'pendingRequests', label: 'Pending Requests', icon: Clock3 },
  { key: 'approvedRequests', label: 'Approved Requests', icon: Users },
]

export default function ResponseSummaryCards({ metrics, errors }) {
  const navigate = useNavigate()
  return <section className="response-summary-cards" aria-label="Operational summary">{cards.map(({ key, label, icon: Icon }) => {
    const errorKey = key === 'activeIncidents' ? 'incidents' : key === 'plannedResponses' ? 'assignments' : key === 'activeShelters' ? 'shelters' : key === 'pendingRequests' || key === 'approvedRequests' ? 'requests' : 'teams'
    const unavailable = errorKey && errors[errorKey]
    const requestStatus = key === 'pendingRequests' ? 'PENDING' : key === 'approvedRequests' ? 'APPROVED' : ''
    const content = <><span className="response-metric-icon"><Icon size={18} /></span><div><span>{label}</span><strong>{unavailable ? '—' : metrics[key]}</strong><small>{unavailable ? 'Data unavailable' : requestStatus ? 'View request details' : 'Current operational data'}</small></div></>
    return requestStatus
      ? <button type="button" className="response-summary-card response-summary-link" key={key} disabled={Boolean(unavailable)} onClick={() => navigate(`/response-operations/request-status?status=${requestStatus}`)}>{content}</button>
      : <article className="response-summary-card" key={key}>{content}</article>
  })}</section>
}
