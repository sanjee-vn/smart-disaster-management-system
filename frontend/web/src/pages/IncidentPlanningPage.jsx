import { useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, BellRing, RefreshCw, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AffectedAreaPanel from '../components/AffectedAreaPanel'
import DashboardLayout from '../components/DashboardLayout'
import ExistingResponseCard from '../components/ExistingResponseCard'
import IncidentOverviewCard from '../components/IncidentOverviewCard'
import LinkedWarningCard from '../components/LinkedWarningCard'
import ResponseRequirementsSelector from '../components/ResponseRequirementsSelector'
import StatusBadge from '../components/StatusBadge'
import ValidationMessage from '../components/ValidationMessage'
import { incidentSituationDemo } from '../data/incidentPlanningDemoContent'
import useIncidentPlanningData from '../hooks/useIncidentPlanningData'
import { loadPlanningRequirements, savePlanningRequirements } from '../utils/responseRequirements'

function IncidentPlanningForm({ incident, assignment, assignmentError, restoredDraft, onRetry }) {
  const navigate = useNavigate()
  const [priority, setPriority] = useState(restoredDraft?.priority || '')
  const [requiredCapabilities, setRequiredCapabilities] = useState(restoredDraft?.requiredCapabilities || loadPlanningRequirements(incident.incidentId))
  const [operationalNotes, setOperationalNotes] = useState(restoredDraft?.operationalNotes || '')
  const [errors, setErrors] = useState({})
  const warning = incident.warning

  const continueToTeams = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!priority) nextErrors.priority = 'Select a response priority.'
    if (requiredCapabilities.length === 0) nextErrors.capabilities = 'Select at least one required response capability.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    const planningDraft = {
      incidentId: incident.incidentId,
      warningId: warning?.warningId || null,
      existingResponseId: assignment?.responseId || null,
      priority,
      requiredCapabilities,
      operationalNotes: operationalNotes.trim(),
    }
    savePlanningRequirements(incident.incidentId, requiredCapabilities)
    navigate(`/response-operations/incidents/${incident.incidentId}/teams`, { state: { planningDraft } })
  }

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident & Response Planning" role="Response Officer"><div className="content incident-planning-page"><button className="back-link" onClick={() => navigate('/response-operations')}><ArrowLeft size={15} /> Response Operations</button><header className="incident-planning-header"><div><p className="warning-eyebrow">Operational Planning · Draft not persisted</p><h1>Incident &amp; Response Planning</h1><p className="subtitle">Assess the incident and define the emergency-response capabilities required.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={incident.status} /></div></div><div className="incident-planning-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>District</span><strong>{incident.district}</strong></div></div></header><div className="planning-information-grid"><IncidentOverviewCard incident={incident} /><LinkedWarningCard warning={warning} /><AffectedAreaPanel incident={incident} situationSummary={incidentSituationDemo.summary} /></div><form onSubmit={continueToTeams} noValidate><ResponseRequirementsSelector selected={requiredCapabilities} onChange={(value) => { setRequiredCapabilities(value); setErrors((current) => ({ ...current, capabilities: '' })) }} error={errors.capabilities} /><div className="planning-form-grid"><section className="planning-card"><div className="planning-card-heading numbered"><span>5</span><div><h2>Response Priority</h2><p>Set the operational planning priority.</p></div></div><div className="field"><label htmlFor="responsePriority">Priority <em>*</em></label><select id="responsePriority" value={priority} onChange={(event) => { setPriority(event.target.value); setErrors((current) => ({ ...current, priority: '' })) }} aria-invalid={Boolean(errors.priority)}><option value="">Select priority</option><option value="LOW">LOW</option><option value="MEDIUM">MEDIUM</option><option value="HIGH">HIGH</option><option value="CRITICAL">CRITICAL</option></select><ValidationMessage message={errors.priority} />{incident.severity === 'EMERGENCY' && <p className="planning-recommendation">CRITICAL is recommended for this EMERGENCY incident. Confirm based on the operational assessment.</p>}</div></section><ExistingResponseCard assignment={assignment} error={assignmentError} onRetry={onRetry} /></div><section className="planning-card"><div className="planning-card-heading numbered"><span>7</span><div><h2>Operational Notes</h2><p>Record planning observations for the next selection step. Notes are not saved to the database.</p></div></div><div className="field"><label htmlFor="operationalNotes">Operational Notes <span>(Optional)</span></label><textarea id="operationalNotes" rows="5" maxLength="2000" value={operationalNotes} onChange={(event) => setOperationalNotes(event.target.value)} placeholder="Priority rescue locations, accessibility concerns, medical requirements or evacuation observations" /></div></section><div className="form-actions planning-actions"><button type="button" className="btn cancel-btn" onClick={() => navigate('/response-operations')}><ArrowLeft size={14} /> Back to Response Operations</button><div>{warning && <button type="button" className="btn cancel-btn" onClick={() => navigate(`/warnings/${warning.warningId}/status`)}><BellRing size={14} /> View Warning</button>}<span>Team selection is the next step</span><button type="submit" className="btn continue-btn">Continue to Team / Dispatch <ArrowRight size={15} /></button></div></div></form></div></DashboardLayout>
}

export default function IncidentPlanningPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { incident, assignments, loading, error, assignmentError, notFound, retry } = useIncidentPlanningData(incidentId)
  if (!incidentId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Incident ID is missing</h3><p>Open a valid incident from Response Operations.</p></div></div></DashboardLayout>
  if (loading) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading incident planning" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning" role="Response Officer"><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Incident not found</h3><p>No incident exists for {incidentId}.</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (error || !incident) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load incident</h3><p>{error || 'Incident data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button></div></div></DashboardLayout>
  const restoredDraft = state?.planningDraft?.incidentId === incident.incidentId ? state.planningDraft : null
  return <IncidentPlanningForm key={incident.incidentId} incident={incident} assignment={assignments[0] || null} assignmentError={assignmentError} restoredDraft={restoredDraft} onRetry={retry} />
}
