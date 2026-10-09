import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import ResourceAllocationDashboardContent from '../components/ResourceAllocationDashboardContent'
import StatusBadge from '../components/StatusBadge'
import useResponseOperationsDashboard from '../hooks/useResponseOperationsDashboard'
import { getOperationalRequests, getTeams, reviewOperationalRequest } from '../services/responseOperationsService'
import { isSuitableOperationalTeam } from '../utils/operationalTeamMatching'
import { requirementLabels } from '../utils/responseRequirements'

export default function DistrictResourceDashboard({ requestsOnly = false }) {
  const navigate = useNavigate()
  const dashboard = useResponseOperationsDashboard(true)
  const [requests, setRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeams, setSelectedTeams] = useState({})
  const [error, setError] = useState('')
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [rejection, setRejection] = useState({ requestId: '', reason: '', note: '' })
  const [notice, setNotice] = useState('')

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    const [requestResult, teamResult] = await Promise.allSettled([getOperationalRequests(), getTeams()])
    const messages = []
    if (requestResult.status === 'fulfilled') setRequests(Array.isArray(requestResult.value) ? requestResult.value : [])
    else messages.push(requestResult.reason.response?.data?.error?.message || 'Unable to load incoming requests.')
    if (teamResult.status === 'fulfilled') setTeams(Array.isArray(teamResult.value) ? teamResult.value : [])
    else messages.push(teamResult.reason.response?.data?.error?.message || 'Unable to load response teams.')
    setError(messages.join(' '))
    setRequestsLoading(false)
  }, [])

  useEffect(() => {
    if (requestsOnly) queueMicrotask(loadRequests)
  }, [loadRequests, requestsOnly])

  const review = async (request, decision) => {
    let rejectionReason
    if (decision === 'REJECT') {
      if (rejection.requestId !== request.requestId || !rejection.reason) return
      rejectionReason = rejection.note.trim() ? `${rejection.reason}: ${rejection.note.trim()}` : rejection.reason
    }
    // Team status is informational: a team remains AVAILABLE even when assigned to other incidents.
    const teamId = selectedTeams[request.requestId] || undefined
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const reviewedRequest = await reviewOperationalRequest(request.requestId, {
        decision, teamId, rejectionReason, reviewedBy: 'District / Resource Coordination Officer',
      })
      setRejection({ requestId: '', reason: '', note: '' })
      await loadRequests()
      if (decision === 'APPROVE') {
        setNotice(reviewedRequest.status === 'APPROVED'
          ? `Request ${request.requestId} approved${reviewedRequest.approvedTeam ? ` and assigned to ${reviewedRequest.approvedTeam.name}` : ''}. It is ready for Review Dispatch on the Response Operations page.`
          : `Request ${request.requestId} updated to ${reviewedRequest.status}.`)
      } else {
        setNotice(`Request ${request.requestId} rejected.`)
      }
    } catch (requestError) {
      const code = requestError.response?.data?.error?.code
      const message = requestError.response?.data?.error?.message || 'Unable to review request.'
      if (code === 'REQUEST_NOT_PENDING') await loadRequests()
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  const pending = requests.filter((request) => request.status === 'PENDING')
  const orderedRequests = [...requests].sort((left, right) => Number(right.status === 'PENDING') - Number(left.status === 'PENDING'))
  const refresh = () => {
    if (requestsOnly) loadRequests()
    else dashboard.retry()
  }

  return <DashboardLayout breadcrumb={requestsOnly ? 'Resource Operations / Incoming Requests' : 'District Resource Coordination'}>
    <div className="content response-operations-page">
      <header className="response-page-header"><div>
        <p className="warning-eyebrow">District / Resource Coordination Officer</p>
        <h1>{requestsOnly ? 'Incoming Operational Requests' : 'District Resource Coordination'}</h1>
        <p className="subtitle">{requestsOnly ? 'Approve requests and optionally assign a matching team. Teams remain available for concurrent incidents.' : 'Review operational requests and coordinate relief-resource fulfilment.'}</p>
      </div><button className="btn btn-secondary" onClick={refresh}><RefreshCw size={14}/> Refresh</button></header>
      {error && <div className="response-partial-warning"><AlertTriangle size={17}/>{error}</div>}
      {notice && <div className="request-action-message success" role="status">{notice}</div>}
      {requestsOnly && <><section className="response-panel">
        <div className="response-panel-heading"><div><h2>Incoming Operational Requests</h2><p>Approve or reject each request. Team assignments do not reserve a team or change its AVAILABLE status.</p></div><span>{pending.length} pending</span></div>
        {requestsLoading ? <div className="response-inline-state">Loading operational requests…</div> : requests.length === 0 ? <div className="response-inline-state">{error ? 'Operational requests are currently unavailable. Use Refresh to try again.' : 'No operational requests received.'}</div> : <div className="table-wrap"><table className="response-table">
          <thead><tr><th>Incident</th><th>Capability</th><th>Personnel</th><th>Location</th><th>Required</th><th>Priority</th><th>Notes</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{orderedRequests.map((request) => {
            const suitableTeams = teams.filter((team) => isSuitableOperationalTeam(team, request))
            const selectedTeamId = selectedTeams[request.requestId] || ''
            const approvedLiveTeam = request.approvedTeam ? teams.find((team) => team.id === request.approvedTeam.id) || request.approvedTeam : null
            const needsTeamAssignment = request.status === 'APPROVED' && !approvedLiveTeam
            const needsReassignment = request.status === 'APPROVED' && approvedLiveTeam && !isSuitableOperationalTeam(approvedLiveTeam, request)
            const canAssignTeam = ['PENDING', 'ACCEPTED'].includes(request.status) || needsTeamAssignment || needsReassignment
            const canSelectTeam = canAssignTeam && suitableTeams.length > 0
            return <tr key={request.id}>
              <td>{request.incident?.incidentId || 'Not available'}</td><td>{requirementLabels[request.capability] || request.capability}</td><td>{request.requestedPersonnelCount}</td><td>{request.requestedLocation}</td><td>{new Date(request.requiredAt).toLocaleString()}</td><td><StatusBadge value={request.priority}/></td><td>{request.notes || '—'}</td>
              <td><StatusBadge value={request.status}/></td>
              <td>{canAssignTeam ? <div className="request-review-actions">
                {canSelectTeam && <select aria-label={`Team assignment for ${request.requestId}`} value={selectedTeamId} onChange={(event) => setSelectedTeams((current) => ({ ...current, [request.requestId]: event.target.value }))}><option value="">Select team to assign</option>{suitableTeams.map((team) => <option key={team.id} value={team.id}>{team.name} · Capacity {team.capacity}</option>)}</select>}
                <button className="btn response-row-action" disabled={busy || (request.status !== 'PENDING' && (suitableTeams.length === 0 || !selectedTeamId))} onClick={() => review(request, 'APPROVE')}>{needsTeamAssignment ? 'Assign Team' : needsReassignment ? 'Reassign Team' : 'Approve'}</button>
                {request.status === 'PENDING' && (rejection.requestId === request.requestId ? <div className="request-rejection-editor"><select aria-label={`Rejection reason for ${request.requestId}`} value={rejection.reason} onChange={(event) => setRejection((current) => ({ ...current, reason: event.target.value }))}><option value="">Select reason</option><option>No suitable team available</option><option>Insufficient personnel capacity</option><option>Team already deployed</option><option>Operational priority conflict</option><option>Request details incomplete</option></select><textarea aria-label={`Rejection note for ${request.requestId}`} placeholder="Optional note" rows="2" value={rejection.note} onChange={(event) => setRejection((current) => ({ ...current, note: event.target.value }))}/><div><button className="btn cancel-btn" disabled={busy || !rejection.reason} onClick={() => review(request, 'REJECT')}>Confirm Reject</button><button className="back-link" disabled={busy} onClick={() => setRejection({ requestId: '', reason: '', note: '' })}>Cancel</button></div></div> : <button className="btn cancel-btn" disabled={busy} onClick={() => setRejection({ requestId: request.requestId, reason: '', note: '' })}>Reject</button>)}
              </div> : 'Reviewed'}</td>
            </tr>
          })}</tbody>
        </table></div>}
      </section>
      <section className="response-panel">
        <div className="response-panel-heading"><div><h2>Response Teams</h2><p>Teams remain AVAILABLE and can be assigned to multiple incidents at the same time.</p></div><span>{teams.length} teams</span></div>
        {requestsLoading ? <div className="response-inline-state">Loading response teams…</div> : teams.length === 0 ? <div className="response-inline-state">No response teams are registered.</div> : <div className="table-wrap"><table className="response-table"><thead><tr><th>Team</th><th>Agency</th><th>Capability</th><th>Location</th><th>Capacity</th><th>Status</th></tr></thead><tbody>{teams.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.agency?.name || 'Agency unavailable'}</td><td>{team.type}</td><td>{team.currentLocation || 'Location unavailable'}</td><td>{team.capacity ?? 'Not available'}</td><td><StatusBadge value="AVAILABLE"/></td></tr>)}</tbody></table></div>}
      </section></>}
      {!requestsOnly && <>{dashboard.loading && <div className="response-inline-state">Loading incidents, shelters, inventory, delivery resources and distributions…</div>}<ResourceAllocationDashboardContent incidents={dashboard.incidents} assignments={dashboard.assignments} shelters={dashboard.shelters} distributions={dashboard.distributions} inventory={dashboard.inventory} deliveryResources={dashboard.deliveryResources} errors={dashboard.errors}/><button className="btn continue-btn" onClick={() => navigate('/response-operations')}>View Response Operations</button></>}
    </div>
  </DashboardLayout>
}
