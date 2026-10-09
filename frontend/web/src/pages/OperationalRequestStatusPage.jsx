import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Eye, RefreshCw } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import StatusBadge from '../components/StatusBadge'
import { getOperationalRequests, getTeams } from '../services/responseOperationsService'
import { isSuitableOperationalTeam } from '../utils/operationalTeamMatching'
import { requirementLabels } from '../utils/responseRequirements'

const statuses = ['ALL', 'PENDING', 'APPROVED', 'ACCEPTED', 'REJECTED', 'DISPATCHED', 'DELIVERED', 'COMPLETED']
const displayTime = (value) => value ? new Date(value).toLocaleString('en-LK') : '—'
const statusMessage = (request, teams) => {
  if (request.status === 'PENDING') return 'Waiting for District Resource Officer review'
  if (request.status === 'APPROVED') {
    if (!request.approvedTeam) return 'Approved — waiting for a suitable available team assignment'
    const liveTeam = teams.find((team) => team.id === request.approvedTeam.id) || request.approvedTeam
    return isSuitableOperationalTeam(liveTeam, request)
      ? 'Approved with assigned team — ready for dispatch'
      : 'Approved — assigned team is no longer available'
  }
  if (request.status === 'ACCEPTED') return request.approvedTeam ? 'Accepted by staff and team assigned — ready for dispatch' : 'Accepted by staff — waiting for District team assignment'
  if (request.status === 'REJECTED') return `Rejected — ${request.rejectionReason || 'reason not available'}`
  if (request.status === 'DISPATCHED') return 'Dispatched — team deployed'
  if (request.status === 'DELIVERED') return 'Marked delivered by staff'
  if (request.status === 'COMPLETED') return 'Response completed'
  return 'Status unavailable'
}

export default function OperationalRequestStatusPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedStatus = String(searchParams.get('status') || 'ALL').toUpperCase()
  const status = statuses.includes(requestedStatus) ? requestedStatus : 'ALL'
  const [requests, setRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [capability, setCapability] = useState('ALL')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [requestData, teamData] = await Promise.all([getOperationalRequests(), getTeams()])
      setRequests(requestData)
      setTeams(teamData)
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load operational request status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { queueMicrotask(load) }, [load])

  const capabilities = useMemo(() => [...new Set(requests.map((request) => request.capability).filter(Boolean))], [requests])
  const visibleRequests = useMemo(() => requests.filter((request) =>
    (status === 'ALL' || request.status === status)
    && (capability === 'ALL' || request.capability === capability)), [requests, status, capability])

  const changeStatus = (nextStatus) => {
    const next = new URLSearchParams(searchParams)
    if (nextStatus === 'ALL') next.delete('status')
    else next.set('status', nextStatus)
    setSearchParams(next)
  }

  return <DashboardLayout breadcrumb="Response Operations / Request Status" role="Response / Operations Officer">
    <div className="content response-operations-page">
      <header className="response-page-header"><div><p className="warning-eyebrow">Response / Operations Officer · Status and dispatch control</p><h1>Operational Request Status</h1><p className="subtitle">Track requests across all incidents from District review through team dispatch.</p></div><button className="btn btn-secondary" disabled={loading} onClick={load}><RefreshCw size={14}/> Refresh</button></header>
      <div className="request-status-filters" aria-label="Operational request filters">
        <div className="request-status-tabs">{statuses.map((item) => <button type="button" key={item} className={status === item ? 'active' : ''} onClick={() => changeStatus(item)}>{item === 'ALL' ? 'All' : item}</button>)}</div>
        <label>Capability<select value={capability} onChange={(event) => setCapability(event.target.value)}><option value="ALL">All capabilities</option>{capabilities.map((item) => <option key={item} value={item}>{requirementLabels[item] || item}</option>)}</select></label>
      </div>
      {loading && <div className="state skeleton" aria-label="Loading operational requests"/>}
      {!loading && error && <div className="state error"><AlertTriangle size={28}/><h3>Unable to load request status</h3><p>{error}</p><button className="btn btn-primary" onClick={load}>Retry</button></div>}
      {!loading && !error && visibleRequests.length === 0 && <div className="response-inline-state">No operational requests match the selected filters.</div>}
      {!loading && !error && visibleRequests.length > 0 && <section className="response-panel"><div className="response-panel-heading"><div><h2>All Incident Requests</h2><p>Request status and assigned-team status are shown separately.</p></div><span>{visibleRequests.length}</span></div><div className="table-wrap"><table className="response-table request-status-table">
        <thead><tr><th>Incident</th><th>Capability / Agency</th><th>Personnel</th><th>Location</th><th>Required</th><th>Priority</th><th>Request Status</th><th>Status Message</th><th>Assigned Team</th><th>Team Status</th><th>Reviewed By</th><th>Reviewed Time</th><th>Rejection Reason</th><th>Dispatch Time</th><th>Action</th></tr></thead>
        <tbody>{visibleRequests.map((request) => <tr key={request.id}>
          <td><strong>{request.incident?.incidentId || 'Not available'}</strong></td><td>{requirementLabels[request.capability] || request.capability}{request.approvedTeam?.agency?.name ? ` · ${request.approvedTeam.agency.name}` : ''}</td><td>{request.requestedPersonnelCount}</td><td>{request.requestedLocation}</td><td>{displayTime(request.requiredAt)}</td><td><StatusBadge value={request.priority}/></td><td><StatusBadge value={request.status}/></td><td className="request-status-message">{statusMessage(request, teams)}</td><td>{request.approvedTeam?.name || (request.status === 'APPROVED' ? 'Not assigned yet' : '—')}</td><td>{request.approvedTeam?.status ? <StatusBadge value={request.approvedTeam.status}/> : '—'}</td><td>{request.reviewedBy || '—'}</td><td>{displayTime(request.reviewedAt)}</td><td>{request.rejectionReason || '—'}</td><td>{displayTime(request.dispatchedAt)}</td><td><div className="request-status-actions">{request.status === 'APPROVED' && request.incident?.incidentId && <button className="btn response-row-action" onClick={() => navigate(`/response-operations/incidents/${encodeURIComponent(request.incident.incidentId)}/assignment?requestId=${encodeURIComponent(request.requestId)}`)}>Review Dispatch</button>}{request.incident?.incidentId && <button className="btn cancel-btn" onClick={() => navigate(`/response-operations/incidents/${encodeURIComponent(request.incident.incidentId)}/requests`)}><Eye size={13}/> View</button>}</div></td>
        </tr>)}</tbody>
      </table></div></section>}
    </div>
  </DashboardLayout>
}
