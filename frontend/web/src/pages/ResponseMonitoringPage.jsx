import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, PackageCheck, RefreshCw, ShieldCheck, Users } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import MonitoringSummaryCards from '../components/MonitoringSummaryCards'
import StatusBadge from '../components/StatusBadge'
import ResourceRequirementContext from '../components/ResourceRequirementContext'
import useResponseMonitoringData from '../hooks/useResponseMonitoringData'
import { resolveResponse } from '../services/responseOperationsService'
import { normalizeRequirements } from '../utils/responseRequirements'

const displayTime = (value) => value ? new Date(value).toLocaleString() : 'Not available'

export default function ResponseMonitoringPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incident, assignment, requests, shelters, distributions, loading, error, lastRefreshed, refresh } = useResponseMonitoringData(incidentId)
  const [confirming, setConfirming] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [resolutionError, setResolutionError] = useState(null)
  const [resolutionMessage, setResolutionMessage] = useState('')
  const metrics = useMemo(() => ({
    teamsAssigned: assignment?.teams?.length || 0,
    activeShelters: shelters.filter((shelter) => shelter.status?.toLowerCase() !== 'inactive').length,
    occupancy: shelters.reduce((sum, shelter) => sum + (Number(shelter.occupancy) || 0), 0),
    capacity: shelters.reduce((sum, shelter) => sum + (Number(shelter.capacity) || 0), 0),
    pendingRequests: shelters.reduce((sum, shelter) => sum + (shelter.pendingRequests?.length || 0), 0),
    enRoute: distributions.filter((distribution) => distribution.status === 'EN_ROUTE').length,
    completed: distributions.filter((distribution) => distribution.status === 'DELIVERED').length,
  }), [assignment, shelters, distributions])

  const resolveIncident = async () => {
    setResolving(true); setResolutionError(null); setResolutionMessage('')
    try {
      const result = await resolveResponse(incidentId)
      setConfirming(false)
      setResolutionMessage(`Incident ${result.incidentId} resolved. Response teams remain AVAILABLE for other incidents.`)
      await refresh()
    } catch (requestError) {
      const body = requestError.response?.data
      setResolutionError({ code: body?.error?.code || body?.code || 'RESPONSE_RESOLUTION_FAILED', message: body?.error?.message || body?.message || 'Response resolution failed.' })
    } finally { setResolving(false) }
  }

  if (!incidentId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle /><h3>Incident ID is missing</h3></div></div></DashboardLayout>
  if (loading && !incident) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading response monitoring" /></div></DashboardLayout>
  if (error || !incident) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle /><h3>Unable to load response monitoring</h3><p>{error}</p><button className="btn btn-primary" onClick={refresh}><RefreshCw size={14} /> Retry</button><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}><ArrowLeft size={14} /> Response Operations</button></div></div></DashboardLayout>

  const resolved = incident.status === 'RESOLVED'
  const resolvable = assignment && ['DISPATCHED', 'IN_PROGRESS'].includes(assignment.status) && !resolved
  const requirements = normalizeRequirements(assignment?.requiredCapabilities)
  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Live Monitoring" role="Response Officer"><div className="content response-monitoring-page">
    <button className="back-link" onClick={() => navigate('/response-operations')}><ArrowLeft size={15} /> Response Operations</button>
    {state?.dispatchNotice && <div className="request-action-message success" role="status"><CheckCircle2 size={16}/>{state.dispatchNotice}</div>}
    <header className="monitoring-header"><div><p className="warning-eyebrow">Live operational overview</p><h1>Response Monitoring &amp; Resolution</h1><p>{incident.affectedArea || incident.district}</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={incident.status} /></div></div><div className="monitoring-context"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Warning ID</span><strong>{incident.warning?.warningId || 'Not linked'}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>District</span><strong>{incident.district}</strong></div><div><span>Response ID</span><strong>{assignment?.responseId || 'No assignment'}</strong></div><div><span>Response status</span><strong>{assignment?.status || 'Not assigned'}</strong></div><div><span>Staff status</span><strong>{assignment?.staffStatus || (assignment ? 'PENDING' : 'Not assigned')}</strong></div><div><span>Last refreshed</span><strong>{displayTime(lastRefreshed)}</strong></div></div></header>
    <div className="monitoring-toolbar"><span>Current data from incident operations</span><button className="btn btn-secondary" disabled={loading} onClick={refresh}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button></div>
    <MonitoringSummaryCards metrics={metrics} />
    <ResourceRequirementContext requirements={requirements} distributions={distributions} compact />
    <section className="monitoring-panel"><div className="monitoring-panel-heading"><Users size={18} /><div><h2>Operational Requests</h2><p>Request review and dispatch progress for this incident</p></div></div>{requests.length === 0 ? <div className="monitoring-empty">No operational requests have been recorded.</div> : <div className="monitoring-table-wrap"><table className="monitoring-table"><thead><tr><th>Request</th><th>Capability</th><th>Personnel</th><th>Location</th><th>Required</th><th>Team</th><th>Status</th></tr></thead><tbody>{requests.map((request) => <tr key={request.id}><td><strong>{request.requestId}</strong></td><td>{request.capability.replaceAll('_', ' ')}</td><td>{request.requestedPersonnelCount}</td><td>{request.requestedLocation}</td><td>{displayTime(request.requiredAt)}</td><td>{request.approvedTeam?.name || request.rejectionReason || 'Not assigned'}</td><td><StatusBadge value={request.status}/></td></tr>)}</tbody></table></div>}</section>

    <section className="monitoring-panel"><div className="monitoring-panel-heading"><Users size={18} /><div><h2>Assigned Response Teams</h2><p>Read-only staff acceptance and team details for this response assignment</p></div></div>{!assignment ? <div className="monitoring-empty">No response assignment is available.</div> : assignment.teams.length === 0 ? <div className="monitoring-empty">No teams are assigned.</div> : <div className="monitoring-table-wrap"><table className="monitoring-table"><thead><tr><th>Team</th><th>Agency</th><th>Type</th><th>Location</th><th>Capacity</th><th>Team Status</th><th>Staff Status</th></tr></thead><tbody>{assignment.teams.map((team) => <tr key={team.id}><td><strong>{team.name}</strong></td><td>{team.agency?.name || 'Not available'}</td><td>{team.type}</td><td>{team.currentLocation || 'Not available'}</td><td>{team.capacity ?? 'Not available'}</td><td><StatusBadge value={team.status} /></td><td><StatusBadge value={assignment.staffStatus || 'PENDING'} /></td></tr>)}</tbody></table></div>}</section>

    <section className="monitoring-panel"><div className="monitoring-panel-heading"><Building2 size={18} /><div><h2>Incident Shelters</h2><p>Capacity and incoming relief overview</p></div></div>{shelters.length === 0 ? <div className="monitoring-empty">No shelters are assigned to this incident.</div> : <div className="monitoring-table-wrap"><table className="monitoring-table"><thead><tr><th>Shelter</th><th>Occupancy</th><th>Available</th><th>Utilization</th><th>Pending</th><th>Incoming</th><th>Status</th></tr></thead><tbody>{shelters.map((shelter) => { const available = Math.max(0, shelter.capacity - shelter.occupancy); const percent = shelter.capacity ? Math.round((shelter.occupancy / shelter.capacity) * 100) : 0; return <tr key={shelter.id}><td><strong>{shelter.name}</strong><small>{shelter.shelterId || ''}</small></td><td>{shelter.occupancy} / {shelter.capacity}</td><td>{available}</td><td>{percent}%</td><td>{shelter.pendingRequests?.length || 0}</td><td>{shelter.incomingResources?.length || 0}</td><td><StatusBadge value={shelter.status} /></td></tr> })}</tbody></table></div>}</section>

    <section className="monitoring-panel"><div className="monitoring-panel-heading"><PackageCheck size={18} /><div><h2>Resource Distributions</h2><p>Current deliveries recorded for this incident</p></div></div>{distributions.length === 0 ? <div className="monitoring-empty">No distributions have been recorded.</div> : <div className="monitoring-table-wrap"><table className="monitoring-table"><thead><tr><th>Distribution</th><th>Destination</th><th>Resource</th><th>Delivery</th><th>ETA</th><th>Created</th><th>Status</th></tr></thead><tbody>{distributions.map((distribution) => <tr key={distribution.id}><td><strong>{distribution.distributionId}</strong></td><td>{distribution.shelter?.name || 'Not available'}</td><td>{distribution.quantity} {distribution.item?.unit || ''} {distribution.item?.itemName || ''}</td><td>{distribution.deliveryResource?.name || 'Not available'}</td><td>{displayTime(distribution.eta)}</td><td>{displayTime(distribution.issuedAt || distribution.createdAt)}</td><td><StatusBadge value={distribution.status} /></td></tr>)}</tbody></table></div>}</section>

    <section className="resolution-panel"><div><ShieldCheck size={22} /><div><h2>Incident Resolution</h2><p>Resolution completes this incident’s response assignment. Shared response teams remain AVAILABLE for concurrent incidents. Shelters and distributions are not automatically closed.</p></div></div>{resolutionMessage && <div className="resolution-success">{resolutionMessage}</div>}{resolutionError && <div className="resolution-error"><strong>{resolutionError.code === 'OUTSTANDING_DISTRIBUTIONS' ? 'Active deliveries prevent resolution' : 'Resolution could not be completed'}</strong><p>{resolutionError.message}</p>{resolutionError.code === 'OUTSTANDING_DISTRIBUTIONS' && <button className="back-link" onClick={() => navigate(`/response-operations/incidents/${incidentId}/resources`)}>Open Resource Coordination</button>}</div>}{resolved ? <div className="resolution-complete"><StatusBadge value="RESOLVED" /> This incident and its response are complete.</div> : !assignment ? <p className="resolution-unavailable">A response assignment is required before this incident can be resolved.</p> : !resolvable ? <p className="resolution-unavailable">Response status {assignment.status} is not resolvable.</p> : confirming ? <div className="resolution-confirm"><p>Confirm resolution? The incident becomes RESOLVED and the response becomes COMPLETED. Team availability does not change.</p><button className="btn cancel-btn" disabled={resolving} onClick={() => setConfirming(false)}>Cancel</button><button className="btn continue-btn" disabled={resolving} onClick={resolveIncident}>{resolving ? 'Resolving…' : 'Confirm Resolution'}</button></div> : <button className="btn continue-btn" onClick={() => { setConfirming(true); setResolutionError(null) }}>Resolve Incident</button>}</section>
  </div></DashboardLayout>
}
