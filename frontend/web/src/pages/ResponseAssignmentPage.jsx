import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Send, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import PlanningContextCard from '../components/PlanningContextCard'
import StatusBadge from '../components/StatusBadge'
import ValidationMessage from '../components/ValidationMessage'
import useTeamSelectionData from '../hooks/useTeamSelectionData'
import { dispatchOperationalRequest, dispatchResponseAssignment, getOperationalRequests } from '../services/responseOperationsService'
import { isSuitableOperationalTeam } from '../utils/operationalTeamMatching'
import { requirementLabels, savePlanningRequirements } from '../utils/responseRequirements'

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

function ResponseAssignmentWorkspace({ incident, teams, teamsError, draft, onRetry }) {
  const navigate = useNavigate()
  const selectedTeams = useMemo(() => draft.selectedTeams.map((selected) => {
    const liveTeam = teams.find((team) => team.id === selected.id)
    return liveTeam ? { ...selected, ...liveTeam, agencyName: liveTeam.agency?.name || selected.agencyName } : selected
  }), [draft.selectedTeams, teams])
  const [form, setForm] = useState({ priority: draft.priority || '', destination: incident.affectedArea || '', instructions: '', eta: '' })
  const [errors, setErrors] = useState({})
  const [reviewing, setReviewing] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const zeroTeamPlan = selectedTeams.length === 0

  const changeField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setReviewing(false)
    setConfirmed(false)
  }
  const validate = () => {
    const nextErrors = {}
    if (!priorities.includes(form.priority)) nextErrors.priority = 'Select a valid dispatch priority.'
    if (!form.destination.trim()) nextErrors.destination = 'Destination is required.'
    if (!form.instructions.trim()) nextErrors.instructions = 'Dispatch instructions are required.'
    if (!form.eta || Number.isNaN(new Date(form.eta).getTime())) nextErrors.eta = 'Select a valid ETA.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }
  const openReview = (event) => {
    event.preventDefault()
    if (!validate()) return
    setReviewing(true)
    setConfirmed(false)
  }
  const goBackToTeams = () => navigate(`/response-operations/incidents/${incident.incidentId}/teams`, { state: { responseAssignmentDraft: draft } })
  const dispatch = async () => {
    if (submitting || !confirmed || !validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await dispatchResponseAssignment({
        incidentId: incident.incidentId, responseId: draft.existingResponseId || undefined,
        teamIds: selectedTeams.map((team) => team.id), priority: form.priority,
        destination: form.destination.trim(), instructions: form.instructions.trim(),
        eta: new Date(form.eta).toISOString(), requiredCapabilities: draft.requiredCapabilities,
      })
      savePlanningRequirements(incident.incidentId, result.requiredCapabilities)
      navigate(`/response-operations/incidents/${encodeURIComponent(incident.incidentId)}/monitoring`, { state: { dispatchNotice: `Response ${result.responseId} dispatched successfully. ${result.teams.length} team${result.teams.length === 1 ? '' : 's'} dispatched; teams remain AVAILABLE for other incidents.` } })
    } catch (requestError) {
      const response = requestError.response?.data
      setSubmitError({ code: response?.code, message: response?.message || 'Unable to dispatch the response assignment.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (zeroTeamPlan) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Response Assignment" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28} /><h3>A response team is required</h3><p>Select an available operational or coordination team before dispatch. This prevents an unresolved response with no active assignment.</p><button className="btn btn-secondary" onClick={goBackToTeams}><ArrowLeft size={14} /> Return to Team Selection</button></div></div></DashboardLayout>

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning / Team Selection / Response Assignment" role="Response Officer"><div className="content response-assignment-page"><button className="back-link" onClick={goBackToTeams}><ArrowLeft size={15} /> Team Selection</button><header className="assignment-page-header"><div><p className="warning-eyebrow">Controlled Operational Dispatch</p><h1>Create / Dispatch Response Assignment</h1><p className="subtitle">Review the response plan and dispatch selected emergency-response teams.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={form.priority || draft.priority} /></div></div><div className="assignment-header-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>Existing Response</span><strong>{draft.existingResponseId || 'New assignment'}</strong></div></div></header><PlanningContextCard draft={draft} /><section className="assignment-card"><div className="assignment-card-heading"><span>2</span><div><h2>Selected Response Teams</h2><p>Current team information is refreshed for review; availability remains AVAILABLE during concurrent dispatch.</p></div></div>{teamsError && <div className="assignment-api-error"><AlertTriangle size={16} /><div><strong>Current team data is unavailable</strong><p>{teamsError}</p></div><button className="back-link" onClick={onRetry}><RefreshCw size={12} /> Retry</button></div>}<div className="table-wrap"><table className="response-table"><thead><tr><th>Team</th><th>Agency</th><th>Type</th><th>Current Status</th><th>Current Location</th></tr></thead><tbody>{selectedTeams.map((team) => <tr key={team.id}><td className="resource-name">{team.name}</td><td>{team.agencyName || team.agency?.name || 'Not available'}</td><td>{team.type}</td><td><StatusBadge value={team.status} /></td><td>{team.currentLocation || 'Not available'}</td></tr>)}</tbody></table></div></section><form onSubmit={openReview} noValidate><section className="assignment-card"><div className="assignment-card-heading"><span>3</span><div><h2>Dispatch Details</h2><p>Provide the final operational destination, instructions, ETA and priority.</p></div></div><div className="form-grid two-columns"><div className="field"><label htmlFor="assignmentPriority">Priority <em>*</em></label><select id="assignmentPriority" value={form.priority} onChange={(event) => changeField('priority', event.target.value)} aria-invalid={Boolean(errors.priority)}>{priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select><ValidationMessage message={errors.priority} /></div><div className="field"><label htmlFor="assignmentDestination">Destination <em>*</em></label><input id="assignmentDestination" value={form.destination} onChange={(event) => changeField('destination', event.target.value)} aria-invalid={Boolean(errors.destination)} /><ValidationMessage message={errors.destination} /></div><div className="field assignment-instructions"><label htmlFor="assignmentInstructions">Instructions <em>*</em></label><textarea id="assignmentInstructions" rows="5" maxLength="2000" value={form.instructions} onChange={(event) => changeField('instructions', event.target.value)} placeholder="Operational objectives, staging instructions and safety requirements" aria-invalid={Boolean(errors.instructions)} /><ValidationMessage message={errors.instructions} /></div><div className="field"><label htmlFor="assignmentEta">ETA <em>*</em></label><input id="assignmentEta" type="datetime-local" value={form.eta} onChange={(event) => changeField('eta', event.target.value)} aria-invalid={Boolean(errors.eta)} /><ValidationMessage message={errors.eta} /></div></div></section>{!reviewing && <div className="form-actions assignment-actions"><button type="button" className="btn cancel-btn" onClick={goBackToTeams}><ArrowLeft size={14} /> Back to Team Selection</button><div><span>No operational data changed yet</span><button type="submit" className="btn continue-btn" disabled={Boolean(teamsError)}>Review Assignment <ArrowRight size={15} /></button></div></div>}</form>{reviewing && <section className="assignment-card assignment-review-card"><div className="assignment-card-heading"><span><CheckCircle2 size={16} /></span><div><h2>Review Assignment</h2><p>Confirm the final operational dispatch.</p></div></div><dl className="assignment-review-details"><div><dt>Incident</dt><dd>{incident.incidentId}</dd></div><div><dt>Response ID</dt><dd>{draft.existingResponseId || 'Generated on dispatch'}</dd></div><div><dt>Priority</dt><dd>{form.priority}</dd></div><div><dt>Destination</dt><dd>{form.destination.trim()}</dd></div><div><dt>ETA</dt><dd>{new Date(form.eta).toLocaleString('en-LK')}</dd></div><div><dt>Team count</dt><dd>{selectedTeams.length}</dd></div><div className="assignment-review-wide"><dt>Instructions</dt><dd>{form.instructions.trim()}</dd></div><div className="assignment-review-wide"><dt>Selected teams</dt><dd>{selectedTeams.map((team) => team.name).join(' · ')}</dd></div></dl><label className="warning-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm that this assignment is ready and the selected teams should be assigned to this incident; their status remains AVAILABLE for other incidents.</span></label>{submitError && <div className="assignment-api-error"><AlertTriangle size={16} /><div><strong>{'Dispatch failed'}</strong><p>{submitError.message}</p></div></div>}<div className="form-actions assignment-actions"><button className="btn cancel-btn" disabled={submitting} onClick={() => { setReviewing(false); setConfirmed(false); setSubmitError(null) }}>Edit Dispatch Details</button><div><span>This action records dispatch atomically; teams remain available for other incidents</span><button className="btn dispatch-assignment-btn" disabled={!confirmed || submitting} onClick={dispatch}><Send size={15} /> {submitting ? 'Dispatching…' : 'Dispatch Response Assignment'}</button></div></div></section>}</div></DashboardLayout>
}

function ApprovedRequestDispatchWorkspace({ incident, requestId, teams, teamsError, onRetry }) {
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const approvedTeam = useMemo(() => {
    if (!request?.approvedTeam) return null
    return teams.find((team) => team.id === request.approvedTeam.id) || request.approvedTeam
  }, [request, teams])
  const approvedTeamIsDispatchable = isSuitableOperationalTeam(approvedTeam, request)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const requests = await getOperationalRequests({ incidentId: incident.incidentId })
      setRequest(requests.find((item) => item.requestId === requestId) || null)
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || 'Unable to load the operational request.')
    } finally {
      setLoading(false)
    }
  }, [incident.incidentId, requestId])

  useEffect(() => { queueMicrotask(load) }, [load])

  const goBack = () => navigate(`/response-operations/incidents/${encodeURIComponent(incident.incidentId)}/requests`)
  const refreshTeamAvailability = () => {
    setConfirmed(false)
    setError('')
    onRetry()
  }
  const confirmDispatch = async () => {
    if (!approvedTeamIsDispatchable || !confirmed || submitting || request?.status !== 'APPROVED') return
    setSubmitting(true)
    setError('')
    try {
      await dispatchOperationalRequest(request.requestId)
      const requests = await getOperationalRequests({ incidentId: incident.incidentId })
      const unresolved = requests.some((item) => ['PENDING', 'APPROVED', 'ACCEPTED'].includes(item.status))
      if (unresolved) {
        navigate(`/response-operations/incidents/${encodeURIComponent(incident.incidentId)}/requests`, { state: { dispatchNotice: 'Team dispatched successfully. Other operational requests are still awaiting review or dispatch.' } })
      } else {
        navigate(`/response-operations/incidents/${encodeURIComponent(incident.incidentId)}/monitoring`, { state: { dispatchNotice: `Request ${request.requestId} dispatched successfully. ${request.approvedTeam?.name || 'The approved response team'} remains AVAILABLE for other incidents.` } })
      }
    } catch (requestError) {
      const message = requestError.response?.data?.error?.message || 'Unable to dispatch this approved request.'
      const requests = await getOperationalRequests({ incidentId: incident.incidentId }).catch(() => null)
      if (requests) setRequest(requests.find((item) => item.requestId === requestId) || null)
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading approved operational request"/></div></DashboardLayout>
  if (error && !request) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28}/><h3>Unable to load dispatch request</h3><p>{error}</p><button className="btn btn-primary" onClick={load}><RefreshCw size={14}/> Retry</button></div></div></DashboardLayout>
  if (!request) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28}/><h3>Operational request not found</h3><p>This request does not belong to the selected incident or no longer exists.</p><button className="btn btn-secondary" onClick={goBack}><ArrowLeft size={14}/> Return to Operational Requests</button></div></div></DashboardLayout>
  if (request.status !== 'APPROVED') {
    const alreadyDispatched = request.status === 'DISPATCHED'
      return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28}/><h3>{alreadyDispatched ? 'This request has already been dispatched.' : 'This request is not ready for dispatch.'}</h3><p>Current request status: {request.status}. A District-assigned team is required before dispatch.</p><button className="btn btn-secondary" onClick={goBack}><ArrowLeft size={14}/> Return to Operational Requests</button></div></div></DashboardLayout>
  }

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content response-assignment-page">
    <button className="back-link" onClick={goBack}><ArrowLeft size={15}/> Operational Requests</button>
    <header className="assignment-page-header"><div><p className="warning-eyebrow">Approved Operational Request · Final Confirmation</p><h1>Team / Dispatch Confirmation</h1><p className="subtitle">Review the District-approved team and request details before atomic dispatch.</p><div className="warning-header-badges"><StatusBadge value={request.status}/><StatusBadge value={request.priority}/></div></div><div className="assignment-header-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Request ID</span><strong>{request.requestId}</strong></div><div><span>Capability</span><strong>{requirementLabels[request.capability] || request.capability}</strong></div></div></header>
    <section className="assignment-card"><div className="assignment-card-heading"><span>1</span><div><h2>Approved Request</h2><p>Review the approved request before selecting a team for dispatch.</p></div></div><dl className="assignment-review-details"><div><dt>Capability</dt><dd>{requirementLabels[request.capability] || request.capability}</dd></div><div><dt>Personnel required</dt><dd>{request.requestedPersonnelCount}</dd></div><div><dt>Destination</dt><dd>{request.requestedLocation}</dd></div><div><dt>Required / ETA</dt><dd>{new Date(request.requiredAt).toLocaleString('en-LK')}</dd></div><div><dt>Priority</dt><dd>{request.priority}</dd></div><div><dt>Reviewed by</dt><dd>{request.reviewedBy || 'Not available'}</dd></div><div className="assignment-review-wide"><dt>Dispatch instructions / notes</dt><dd>{request.notes || `Fulfil ${request.capability} operational request`}</dd></div></dl></section>
    <section className="assignment-card"><div className="assignment-card-heading"><span>2</span><div><h2>District-Assigned Team</h2><p>The District Officer selected this team during approval. Confirm its live status before dispatch.</p></div></div>{teamsError && <div className="assignment-api-error"><AlertTriangle size={16}/><div><strong>Team availability is unavailable</strong><p>{teamsError}</p></div><button className="back-link" onClick={refreshTeamAvailability}><RefreshCw size={12}/> Retry</button></div>}{!teamsError && !approvedTeam && <div className="dispatch-blocked-state" role="status"><AlertTriangle size={22}/><div><strong>This approved request is waiting for a team assignment.</strong><p>Assign a suitable AVAILABLE team on Incoming Requests before dispatch.</p><div className="dispatch-blocked-actions"><button className="btn cancel-btn" onClick={goBack}><ArrowLeft size={14}/> Back to Requests</button><button className="btn back-link" onClick={() => navigate('/response-operations/request-status?status=APPROVED')}>Request Status</button></div></div></div>}{!teamsError && approvedTeam && !approvedTeamIsDispatchable && <div className="dispatch-blocked-state" role="status"><AlertTriangle size={22}/><div><strong>Approved team is no longer available.</strong><p>This request remains APPROVED. The District Officer must re-review the request before dispatch; another team will not be selected automatically.</p><dl className="approved-team-summary"><div><dt>Team</dt><dd>{approvedTeam.name}</dd></div><div><dt>Current status</dt><dd><StatusBadge value={approvedTeam.status}/></dd></div><div><dt>Capacity</dt><dd>{approvedTeam.capacity ?? 'Not available'}</dd></div></dl><div className="dispatch-blocked-actions"><button className="btn cancel-btn" onClick={goBack}><ArrowLeft size={14}/> Back to Requests</button><button className="btn btn-secondary" onClick={refreshTeamAvailability}><RefreshCw size={14}/> Refresh Team Availability</button></div></div></div>}{!teamsError && approvedTeamIsDispatchable && <div className="table-wrap"><table className="response-table"><thead><tr><th>Assigned Team</th><th>Agency</th><th>Type / Capability</th><th>Capacity</th><th>Current Status</th></tr></thead><tbody><tr><td><strong>{approvedTeam.name}</strong></td><td>{approvedTeam.agency?.name || 'Not available'}</td><td>{approvedTeam.type}</td><td>{approvedTeam.capacity ?? 'Not available'}</td><td><StatusBadge value={approvedTeam.status}/></td></tr></tbody></table></div>}</section>
    {error && <div className="assignment-api-error"><AlertTriangle size={16}/><div><strong>Dispatch could not be completed</strong><p>{error}</p></div></div>}
    {!teamsError && approvedTeamIsDispatchable && <section className="assignment-card assignment-review-card"><label className="warning-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span>I confirm the District-assigned team is ready for dispatch.</span></label><div className="form-actions assignment-actions"><button className="btn cancel-btn" disabled={submitting} onClick={goBack}><ArrowLeft size={14}/> Back to Requests</button><div><span>This action deploys the approved team atomically</span><button className="btn dispatch-assignment-btn" disabled={!confirmed || submitting} onClick={confirmDispatch}><Send size={15}/>{submitting ? 'Dispatching…' : 'Confirm Dispatch'}</button></div></div></section>}
  </div></DashboardLayout>
}

export default function ResponseAssignmentPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestId = searchParams.get('requestId')?.trim() || ''
  const draft = state?.responseAssignmentDraft?.incidentId === incidentId ? state.responseAssignmentDraft : null
  const { incident, teams, errors, loading, notFound, retry } = useTeamSelectionData(incidentId)
  if (!incidentId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Incident ID is missing</h3><p>Open this page from a valid incident workflow.</p></div></div></DashboardLayout>
  if (loading) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading response assignment" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Incident not found</h3><p>No incident exists for {incidentId}.</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (errors.incident || !incident) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load incident</h3><p>{errors.incident || 'Incident data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button></div></div></DashboardLayout>
  if (requestId) return <ApprovedRequestDispatchWorkspace key={`${incidentId}:${requestId}`} incident={incident} requestId={requestId} teams={teams} teamsError={errors.teams} onRetry={retry}/>
  if (!draft) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team / Dispatch" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28} /><h3>Select an approved operational request to continue.</h3><p>Open this confirmation step from an APPROVED request. No team or request has been changed.</p><button className="btn btn-secondary" onClick={() => navigate(`/response-operations/incidents/${encodeURIComponent(incidentId)}/requests`)}><ArrowLeft size={14}/> Open Operational Requests</button></div></div></DashboardLayout>
  return <ResponseAssignmentWorkspace key={incidentId} incident={incident} teams={teams} teamsError={errors.teams} draft={draft} onRetry={retry} />
}
