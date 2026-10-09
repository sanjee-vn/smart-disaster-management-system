import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import ResourceAllocationDashboardContent from '../components/ResourceAllocationDashboardContent'
import StatusBadge from '../components/StatusBadge'
import useResponseOperationsDashboard from '../hooks/useResponseOperationsDashboard'
import { getOperationalRequests, getTeams, markTeamAvailable, reviewOperationalRequest } from '../services/responseOperationsService'
import { isSuitableOperationalTeam, teamMatchesCapability } from '../utils/operationalTeamMatching'
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
    else messages.push(teamResult.reason.response?.data?.error?.message || 'Unable to load team availability.')
    setError(messages.join(' '))
    setRequestsLoading(false)
  }, [])

  useEffect(() => { queueMicrotask(loadRequests) }, [loadRequests])

  const review = async (request, decision) => {
    let rejectionReason
    if (decision === 'REJECT') {
      if (rejection.requestId !== request.requestId || !rejection.reason) return
      rejectionReason = rejection.note.trim() ? `${rejection.reason}: ${rejection.note.trim()}` : rejection.reason
    }
    const teamId = selectedTeams[request.requestId]
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
    loadRequests()
    if (!requestsOnly) dashboard.retry()
  }

  const releaseTeam = async (team) => {
    if (!window.confirm(`Confirm that ${team.name} has completed its deployment and can accept new work?`)) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await markTeamAvailable(team.id)
      setNotice(`${team.name} is now AVAILABLE for new operational requests.`)
      await loadRequests()
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to update team availability.')
      await loadRequests()
    } finally {
      setBusy(false)
    }
  }

  const deployedTeams = teams.filter((team) => team.status === 'DEPLOYED')

  return <DashboardLayout breadcrumb={requestsOnly ? 'Resource Operations / Incoming Requests' : 'District Resource Coordination'}>
    <div className="content response-operations-page">
      <header className="response-page-header"><div>
        <p className="warning-eyebrow">District / Resource Coordination Officer</p>
        <h1>{requestsOnly ? 'Incoming Operational Requests' : 'District Resource Coordination'}</h1>
        <p className="subtitle">{requestsOnly ? 'Approve requests now, then assign a suitable team when one is available before dispatch, or reject with a reason.' : 'Review operational requests and coordinate relief-resource fulfilment.'}</p>
      </div><button className="btn btn-secondary" onClick={refresh}><RefreshCw size={14}/> Refresh</button></header>
      {error && <div className="response-partial-warning"><AlertTriangle size={17}/>{error}</div>}
      {notice && <div className="request-action-message success" role="status">{notice}</div>}
      <section className="response-panel">
        <div className="response-panel-heading"><div><h2>Incoming Operational Requests</h2><p>Approve a request even when no suitable team is available; assign a matching team later before dispatch.</p></div><span>{pending.length} pending</span></div>
        {requestsLoading ? <div className="response-inline-state">Loading operational requests and team availability…</div> : requests.length === 0 ? <div className="response-inline-state">{error ? 'Operational requests are currently unavailable. Use Refresh to try again.' : 'No operational requests received.'}</div> : <div className="table-wrap"><table className="response-table">
          <thead><tr><th>Incident</th><th>Capability</th><th>Personnel</th><th>Location</th><th>Required</th><th>Priority</th><th>Notes</th><th>Status</th><th>Suitable Available Team</th><th>Action</th></tr></thead>
          <tbody>{orderedRequests.map((request) => {
            const suitableTeams = teams.filter((team) => isSuitableOperationalTeam(team, request))
            const capabilityTeams = teams.filter((team) => teamMatchesCapability(team, request.capability))
            const availableCapabilityTeams = capabilityTeams.filter((team) => team.status === 'AVAILABLE')
            const requestPeople = Number(request.requestedPersonnelCount || 0)
            const maxAvailableCapacity = availableCapabilityTeams.reduce((max, team) => Math.max(max, Number(team.capacity || 0)), 0)
            const teamAvailabilityReason = capabilityTeams.length === 0
              ? `No team is registered for ${requirementLabels[request.capability] || request.capability}.`
              : availableCapabilityTeams.length === 0
                ? `Matching teams are not AVAILABLE. Release one after field work is complete.`
                : maxAvailableCapacity < requestPeople
                  ? `Request needs ${requestPeople} people; the largest matching available team has capacity ${maxAvailableCapacity}.`
                  : 'A suitable team is available.'
            const selectedTeamId = selectedTeams[request.requestId] || ''
            const approvedLiveTeam = request.approvedTeam ? teams.find((team) => team.id === request.approvedTeam.id) || request.approvedTeam : null
            const needsTeamAssignment = request.status === 'APPROVED' && !approvedLiveTeam
            const needsReassignment = request.status === 'APPROVED' && approvedLiveTeam && !isSuitableOperationalTeam(approvedLiveTeam, request)
            const canAssignTeam = ['PENDING', 'ACCEPTED'].includes(request.status) || needsTeamAssignment || needsReassignment
            return <tr key={request.id}>
              <td>{request.incident?.incidentId || 'Not available'}</td><td>{requirementLabels[request.capability] || request.capability}</td><td>{request.requestedPersonnelCount}</td><td>{request.requestedLocation}</td><td>{new Date(request.requiredAt).toLocaleString()}</td><td><StatusBadge value={request.priority}/></td><td>{request.notes || '—'}</td>
              <td><StatusBadge value={request.status}/></td><td>{canAssignTeam ? (suitableTeams.length > 0 ? <><select aria-label={`Suitable team for ${request.requestId}`} value={selectedTeamId} onChange={(event) => setSelectedTeams((current) => ({ ...current, [request.requestId]: event.target.value }))}><option value="">Select team</option>{suitableTeams.map((team) => <option key={team.id} value={team.id}>{team.name} · Capacity {team.capacity}</option>)}</select><small className="request-team-availability-help">Only AVAILABLE teams with matching capability and enough capacity can be assigned.</small></> : <div className="request-team-unavailable"><strong>{request.status === 'PENDING' ? 'No suitable team available' : 'Waiting for suitable team assignment'}</strong><small>{request.status === 'PENDING' ? teamAvailabilityReason : 'This request is approved. Assign a matching AVAILABLE team when one has enough capacity.'}</small></div>) : request.approvedTeam?.name || request.rejectionReason || '—'}</td>
              <td>{canAssignTeam ? <div className="request-review-actions"><button className="btn response-row-action" disabled={busy || (request.status !== 'PENDING' && (suitableTeams.length === 0 || !selectedTeamId))} onClick={() => review(request, 'APPROVE')}>{needsTeamAssignment ? 'Assign Team' : needsReassignment ? 'Reassign Team' : 'Approve'}</button>{request.status === 'PENDING' && (rejection.requestId === request.requestId ? <div className="request-rejection-editor"><select aria-label={`Rejection reason for ${request.requestId}`} value={rejection.reason} onChange={(event) => setRejection((current) => ({ ...current, reason: event.target.value }))}><option value="">Select reason</option><option>No suitable team available</option><option>Insufficient personnel capacity</option><option>Team already deployed</option><option>Operational priority conflict</option><option>Request details incomplete</option></select><textarea aria-label={`Rejection note for ${request.requestId}`} placeholder="Optional note" rows="2" value={rejection.note} onChange={(event) => setRejection((current) => ({ ...current, note: event.target.value }))}/><div><button className="btn cancel-btn" disabled={busy || !rejection.reason} onClick={() => review(request, 'REJECT')}>Confirm Reject</button><button className="back-link" disabled={busy} onClick={() => setRejection({ requestId: '', reason: '', note: '' })}>Cancel</button></div></div> : <button className="btn cancel-btn" disabled={busy} onClick={() => setRejection({ requestId: request.requestId, reason: suitableTeams.length ? '' : 'No suitable team available', note: '' })}>Reject</button>)}</div> : 'Reviewed'}</td>
            </tr>
          })}</tbody>
        </table></div>}
      </section>
      <section className="response-panel team-availability-panel">
        <div className="response-panel-heading"><div><h2>Deployed Team Management</h2><p>After field work is physically completed, release a deployed team so it can be selected for another request.</p></div><span>{deployedTeams.length} deployed</span></div>
        {requestsLoading ? <div className="response-inline-state">Loading deployed teams…</div> : deployedTeams.length === 0 ? <div className="response-inline-state">No teams are currently deployed.</div> : <div className="team-release-grid">{deployedTeams.map((team) => <article key={team.id} className="team-release-card"><div><strong>{team.name}</strong><span>{team.agency?.name || 'Agency unavailable'} · {team.type}</span><small>{team.currentLocation || 'Location unavailable'} · Capacity {team.capacity ?? 'Not available'}</small></div><div><StatusBadge value={team.status}/><button className="btn btn-secondary" disabled={busy} onClick={() => releaseTeam(team)}>Mark Available</button></div></article>)}</div>}
      </section>
      {!requestsOnly && <>{dashboard.loading && <div className="response-inline-state">Loading incidents, shelters, inventory, delivery resources and distributions…</div>}<ResourceAllocationDashboardContent incidents={dashboard.incidents} assignments={dashboard.assignments} shelters={dashboard.shelters} distributions={dashboard.distributions} inventory={dashboard.inventory} deliveryResources={dashboard.deliveryResources} errors={dashboard.errors}/><button className="btn continue-btn" onClick={() => navigate('/response-operations')}>View Response Operations</button></>}
    </div>
  </DashboardLayout>
}
