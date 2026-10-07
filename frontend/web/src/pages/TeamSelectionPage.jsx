import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, RefreshCw, ShieldAlert } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import AgencyFilterBar from '../components/AgencyFilterBar'
import DashboardLayout from '../components/DashboardLayout'
import ExistingResponseCard from '../components/ExistingResponseCard'
import PlanningContextCard from '../components/PlanningContextCard'
import ResponseTeamTable from '../components/ResponseTeamTable'
import SelectedTeamsSummary from '../components/SelectedTeamsSummary'
import StatusBadge from '../components/StatusBadge'
import ValidationMessage from '../components/ValidationMessage'
import useTeamSelectionData from '../hooks/useTeamSelectionData'

const teamCapabilities = new Set(['RESCUE', 'POLICE', 'ARMED_FORCES', 'FIRE_RESCUE', 'MEDICAL'])
const resourceCapabilities = new Set(['SHELTER', 'EVACUATION', 'FOOD', 'WATER', 'MEDICINE'])

const matchesCapability = (team, capability) => {
  const agencyType = team.agency?.type
  if (capability === 'RESCUE') return /rescue/i.test(team.type)
  if (capability === 'POLICE') return agencyType === 'POLICE'
  if (capability === 'ARMED_FORCES') return agencyType === 'ARMED_FORCES'
  if (capability === 'FIRE_RESCUE') return agencyType === 'FIRE_RESCUE'
  if (capability === 'MEDICAL') return agencyType === 'MEDICAL'
  return false
}

const getPlanningDraft = (state, incidentId) => {
  const candidate = state?.responseAssignmentDraft || state?.planningDraft
  return candidate?.incidentId === incidentId ? candidate : null
}

function TeamSelectionWorkspace({ incident, agencies, teams, assignments, errors, draft, onRetry }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ agencyId: 'ALL', teamType: 'ALL', availability: 'AVAILABLE' })
  const [selectedTeams, setSelectedTeams] = useState(() => (draft.selectedTeams || []).filter((team) => team.status === 'AVAILABLE'))
  const [noTeamConfirmed, setNoTeamConfirmed] = useState(false)
  const [validationError, setValidationError] = useState('')
  const requiredCapabilities = useMemo(() => draft.requiredCapabilities || [], [draft.requiredCapabilities])
  const hasTeamCapability = requiredCapabilities.some((capability) => teamCapabilities.has(capability))
  const resourceOnlyPlan = requiredCapabilities.length > 0 && !hasTeamCapability && requiredCapabilities.every((capability) => resourceCapabilities.has(capability))
  const teamTypes = useMemo(() => [...new Set(teams.map((team) => team.type))].sort(), [teams])
  const recommendedIds = useMemo(() => new Set(teams.filter((team) => requiredCapabilities.some((capability) => matchesCapability(team, capability))).map((team) => team.id)), [teams, requiredCapabilities])
  const filteredTeams = teams.filter((team) => (filters.agencyId === 'ALL' || team.agency?.id === filters.agencyId) && (filters.teamType === 'ALL' || team.type === filters.teamType) && (filters.availability === 'ALL' || team.status === filters.availability))

  const toggleTeam = (team) => {
    if (team.status !== 'AVAILABLE') return
    setSelectedTeams((current) => current.some((item) => item.id === team.id) ? current.filter((item) => item.id !== team.id) : [...current, team])
    setValidationError('')
  }
  const basePlanningDraft = {
    incidentId: draft.incidentId, warningId: draft.warningId ?? null,
    existingResponseId: draft.existingResponseId ?? null, priority: draft.priority,
    requiredCapabilities, operationalNotes: draft.operationalNotes || '',
  }
  const continueToAssignment = () => {
    if (selectedTeams.length === 0 && !(resourceOnlyPlan && noTeamConfirmed)) {
      setValidationError(resourceOnlyPlan ? 'Confirm that this shelter/resource-only plan requires no response team.' : 'Select at least one available response team.')
      return
    }
    const responseAssignmentDraft = {
      ...basePlanningDraft,
      selectedTeams: selectedTeams.map((team) => ({ id: team.id, name: team.name, agencyId: team.agency?.id || null, agencyName: team.agency?.name || null, type: team.type, status: team.status })),
    }
    navigate(`/response-operations/incidents/${incident.incidentId}/assignment`, { state: { responseAssignmentDraft } })
  }

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Incident Planning / Team Selection" role="Response Officer"><div className="content team-selection-page"><button className="back-link" onClick={() => navigate(`/response-operations/incidents/${incident.incidentId}`, { state: { planningDraft: basePlanningDraft } })}><ArrowLeft size={15} /> Incident Planning</button><header className="team-selection-header"><div><p className="warning-eyebrow">Response Assignment · Draft not persisted</p><h1>Agency &amp; Team Selection</h1><p className="subtitle">Select available response teams for this incident.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={draft.priority} /></div></div><div className="team-header-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>District</span><strong>{incident.district}</strong></div></div></header><PlanningContextCard draft={basePlanningDraft} /><AgencyFilterBar agencies={agencies} teamTypes={teamTypes} filters={filters} agencyError={errors.agencies} onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))} /><div className="team-selection-workspace"><ResponseTeamTable teams={filteredTeams} selectedIds={selectedTeams.map((team) => team.id)} recommendedIds={recommendedIds} onToggle={toggleTeam} error={errors.teams} /><div className="team-selection-sidebar"><SelectedTeamsSummary teams={selectedTeams} onRemove={(id) => { setSelectedTeams((current) => current.filter((team) => team.id !== id)); setValidationError('') }} /><ExistingResponseCard assignment={assignments[0] || null} error={errors.assignments} onRetry={onRetry} /></div></div>{resourceOnlyPlan && selectedTeams.length === 0 && <label className="no-team-confirmation"><input type="checkbox" checked={noTeamConfirmed} onChange={(event) => { setNoTeamConfirmed(event.target.checked); setValidationError('') }} /><span><strong>No response team is required for the selected shelter/resource-only plan.</strong><small>These capabilities will be handled in later Shelter / Resource Coordination steps.</small></span></label>}<ValidationMessage message={validationError} /><div className="form-actions planning-actions"><button className="btn cancel-btn" onClick={() => navigate(`/response-operations/incidents/${incident.incidentId}`, { state: { planningDraft: basePlanningDraft } })}><ArrowLeft size={14} /> Back to Incident Planning</button><div><span>No teams will be dispatched yet</span><button className="btn continue-btn" disabled={Boolean(errors.teams)} onClick={continueToAssignment}>Continue to Assignment <ArrowRight size={15} /></button></div></div></div></DashboardLayout>
}

export default function TeamSelectionPage() {
  const { incidentId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const draft = getPlanningDraft(state, incidentId)
  const { incident, agencies, teams, assignments, errors, loading, notFound, retry } = useTeamSelectionData(incidentId)
  if (!incidentId) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Incident ID is missing</h3><p>Open Team Selection from a valid incident.</p></div></div></DashboardLayout>
  if (loading) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading team selection" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Incident not found</h3><p>No incident exists for {incidentId}.</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (errors.incident || !incident) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load incident</h3><p>{errors.incident || 'Incident data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button></div></div></DashboardLayout>
  if (!draft) return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Team Selection" role="Response Officer"><div className="content"><div className="state"><AlertTriangle size={28} /><h3>No response planning draft is available</h3><p>Return to Incident Planning to select requirements and priority.</p><button className="btn btn-secondary" onClick={() => navigate(`/response-operations/incidents/${incidentId}`)}><ArrowLeft size={14} /> Return to Incident Planning</button></div></div></DashboardLayout>
  return <TeamSelectionWorkspace key={incidentId} incident={incident} agencies={agencies} teams={teams} assignments={assignments} errors={errors} draft={draft} onRetry={retry} />
}
