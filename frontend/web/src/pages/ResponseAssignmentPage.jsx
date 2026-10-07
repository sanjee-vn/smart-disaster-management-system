import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Send, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import PlanningContextCard from '../components/PlanningContextCard'
import StatusBadge from '../components/StatusBadge'
import ValidationMessage from '../components/ValidationMessage'
import useTeamSelectionData from '../hooks/useTeamSelectionData'
import { dispatchResponseAssignment } from '../services/responseOperationsService'

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
  const continueWithoutDispatch = () => navigate(`/response-operations/incidents/${incident.incidentId}/shelters`, { state: { responseContext: { incidentId: incident.incidentId, responseId: draft.existingResponseId || null, responseStatus: 'NOT_DISPATCHED', deployedTeamCount: 0, noTeamDispatch: true } } })
  const dispatch = async () => {
    if (submitting || !confirmed || !validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await dispatchResponseAssignment({
        incidentId: incident.incidentId, responseId: draft.existingResponseId || undefined,
        teamIds: selectedTeams.map((team) => team.id), priority: form.priority,
        destination: form.destination.trim(), instructions: form.instructions.trim(),
        eta: new Date(form.eta).toISOString(),
      })
      navigate(`/response-operations/incidents/${incident.incidentId}/shelters`, { state: { responseContext: { incidentId: incident.incidentId, responseId: result.responseId, responseStatus: result.status, deployedTeamCount: result.teams.length } } })
    } catch (requestError) {
      const response = requestError.response?.data
      setSubmitError({ code: response?.code, message: response?.message || 'Unable to dispatch the response assignment.' })
    } finally {
      setSubmitting(false)
    }
  }

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning / Team Selection / Response Assignment" role="Response Officer"><div className="content response-assignment-page"><button className="back-link" onClick={goBackToTeams}><ArrowLeft size={15} /> Team Selection</button><header className="assignment-page-header"><div><p className="warning-eyebrow">Controlled Operational Dispatch</p><h1>Create / Dispatch Response Assignment</h1><p className="subtitle">Review the response plan and dispatch selected emergency-response teams.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={form.priority || draft.priority} /></div></div><div className="assignment-header-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>Existing Response</span><strong>{draft.existingResponseId || 'New assignment'}</strong></div></div></header><PlanningContextCard draft={draft} /><section className="assignment-card"><div className="assignment-card-heading"><span>2</span><div><h2>Selected Response Teams</h2><p>Current team information is refreshed for review; availability is revalidated atomically on dispatch.</p></div></div>{teamsError && <div className="assignment-api-error"><AlertTriangle size={16} /><div><strong>Current team data is unavailable</strong><p>{teamsError}</p></div><button className="back-link" onClick={onRetry}><RefreshCw size={12} /> Retry</button></div>}{zeroTeamPlan ? <div className="zero-team-notice"><CheckCircle2 size={18} /><div><strong>No response-team dispatch is required for this plan.</strong><p>Continue to Shelter Coordination without creating or dispatching a team assignment.</p></div></div> : <div className="table-wrap"><table className="response-table"><thead><tr><th>Team</th><th>Agency</th><th>Type</th><th>Current Status</th><th>Current Location</th></tr></thead><tbody>{selectedTeams.map((team) => <tr key={team.id}><td className="resource-name">{team.name}</td><td>{team.agencyName || team.agency?.name || 'Not available'}</td><td>{team.type}</td><td><StatusBadge value={team.status} /></td><td>{team.currentLocation || 'Not available'}</td></tr>)}</tbody></table></div>}</section>{zeroTeamPlan ? <div className="form-actions assignment-actions"><button className="btn cancel-btn" onClick={goBackToTeams}><ArrowLeft size={14} /> Back to Team Selection</button><div><span>No team or assignment status will be changed</span><button className="btn continue-btn" onClick={continueWithoutDispatch}>Continue to Shelter Coordination <ArrowRight size={15} /></button></div></div> : <form onSubmit={openReview} noValidate><section className="assignment-card"><div className="assignment-card-heading"><span>3</span><div><h2>Dispatch Details</h2><p>Provide the final operational destination, instructions, ETA and priority.</p></div></div><div className="form-grid two-columns"><div className="field"><label htmlFor="assignmentPriority">Priority <em>*</em></label><select id="assignmentPriority" value={form.priority} onChange={(event) => changeField('priority', event.target.value)} aria-invalid={Boolean(errors.priority)}>{priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select><ValidationMessage message={errors.priority} /></div><div className="field"><label htmlFor="assignmentDestination">Destination <em>*</em></label><input id="assignmentDestination" value={form.destination} onChange={(event) => changeField('destination', event.target.value)} aria-invalid={Boolean(errors.destination)} /><ValidationMessage message={errors.destination} /></div><div className="field assignment-instructions"><label htmlFor="assignmentInstructions">Instructions <em>*</em></label><textarea id="assignmentInstructions" rows="5" maxLength="2000" value={form.instructions} onChange={(event) => changeField('instructions', event.target.value)} placeholder="Operational objectives, staging instructions and safety requirements" aria-invalid={Boolean(errors.instructions)} /><ValidationMessage message={errors.instructions} /></div><div className="field"><label htmlFor="assignmentEta">ETA <em>*</em></label><input id="assignmentEta" type="datetime-local" value={form.eta} onChange={(event) => changeField('eta', event.target.value)} aria-invalid={Boolean(errors.eta)} /><ValidationMessage message={errors.eta} /></div></div></section>{!reviewing && <div className="form-actions assignment-actions"><button type="button" className="btn cancel-btn" onClick={goBackToTeams}><ArrowLeft size={14} /> Back to Team Selection</button><div><span>No operational data changed yet</span><button type="submit" className="btn continue-btn" disabled={Boolean(teamsError)}>Review Assignment <ArrowRight size={15} /></button></div></div>}</form>}{reviewing && !zeroTeamPlan && <section className="assignment-card assignment-review-card"><div className="assignment-card-heading"><span><CheckCircle2 size={16} /></span><div><h2>Review Assignment</h2><p>Confirm the final operational dispatch.</p></div></div><dl className="assignment-review-details"><div><dt>Incident</dt><dd>{incident.incidentId}</dd></div><div><dt>Response ID</dt><dd>{draft.existingResponseId || 'Generated on dispatch'}</dd></div><div><dt>Priority</dt><dd>{form.priority}</dd></div><div><dt>Destination</dt><dd>{form.destination.trim()}</dd></div><div><dt>ETA</dt><dd>{new Date(form.eta).toLocaleString('en-LK')}</dd></div><div><dt>Team count</dt><dd>{selectedTeams.length}</dd></div><div className="assignment-review-wide"><dt>Instructions</dt><dd>{form.instructions.trim()}</dd></div><div className="assignment-review-wide"><dt>Selected teams</dt><dd>{selectedTeams.map((team) => team.name).join(' · ')}</dd></div></dl><label className="warning-confirmation"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I confirm that this assignment is ready and the selected available teams should be dispatched.</span></label>{submitError && <div className="assignment-api-error"><AlertTriangle size={16} /><div><strong>{submitError.code === 'TEAM_UNAVAILABLE' ? 'Team availability changed' : 'Dispatch failed'}</strong><p>{submitError.code === 'TEAM_UNAVAILABLE' ? 'One or more selected teams are no longer available.' : submitError.message}</p></div>{submitError.code === 'TEAM_UNAVAILABLE' && <button className="btn cancel-btn" onClick={goBackToTeams}>Return to Team Selection</button>}</div>}<div className="form-actions assignment-actions"><button className="btn cancel-btn" disabled={submitting} onClick={() => { setReviewing(false); setConfirmed(false); setSubmitError(null) }}>Edit Dispatch Details</button><div><span>This action deploys teams atomically</span><button className="btn dispatch-assignment-btn" disabled={!confirmed || submitting} onClick={dispatch}><Send size={15} /> {submitting ? 'Dispatching…' : 'Dispatch Response Assignment'}</button></div></div></section>}</div></DashboardLayout>
}

export default function ResponseAssignmentPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const draft = state?.responseAssignmentDraft?.incidentId === incidentId ? state.responseAssignmentDraft : null
  const { incident, teams, errors, loading, notFound, retry } = useTeamSelectionData(incidentId)
  if (!incidentId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Incident ID is missing</h3><p>Open this page from a valid incident workflow.</p></div></div></DashboardLayout>
  if (loading) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading response assignment" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Incident not found</h3><p>No incident exists for {incidentId}.</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (errors.incident || !incident) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load incident</h3><p>{errors.incident || 'Incident data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button></div></div></DashboardLayout>
  if (!draft) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Response Assignment" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28} /><h3>No response assignment draft is available</h3><p>Return to Team Selection to prepare an assignment.</p><button className="btn btn-secondary" onClick={() => navigate(`/response-operations/incidents/${incidentId}/teams`)}><ArrowLeft size={14} /> Return to Team Selection</button></div></div></DashboardLayout>
  return <ResponseAssignmentWorkspace key={incidentId} incident={incident} teams={teams} teamsError={errors.teams} draft={draft} onRetry={retry} />
}
