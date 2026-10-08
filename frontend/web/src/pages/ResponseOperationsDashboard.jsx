import { AlertTriangle, RefreshCw } from 'lucide-react'
import ActiveIncidentsTable from '../components/ActiveIncidentsTable'
import CurrentAssignmentsPanel from '../components/CurrentAssignmentsPanel'
import DashboardLayout from '../components/DashboardLayout'
import ResponseActivityPanel from '../components/ResponseActivityPanel'
import ResponseSummaryCards from '../components/ResponseSummaryCards'
import useResponseOperationsDashboard from '../hooks/useResponseOperationsDashboard'

export default function ResponseOperationsDashboard() {
  const { incidents, assignments, teams, shelters, distributions, errors, loading, retry } = useResponseOperationsDashboard()
  if (loading) return <DashboardLayout activeSection="overview" breadcrumb="Operations / Response Operations" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading response operations" /></div></DashboardLayout>

  const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED')
  const metrics = {
    activeIncidents: activeIncidents.length,
    plannedResponses: assignments.filter((assignment) => assignment.status === 'PLANNED').length,
    deployedTeams: teams.filter((team) => team.status === 'DEPLOYED').length,
    activeShelters: shelters.filter((shelter) => shelter.status?.toLowerCase() !== 'inactive').length,
    resourcesEnRoute: distributions.filter((distribution) => distribution.status === 'EN_ROUTE').length,
  }
  const hasErrors = Object.keys(errors).length > 0

  return <DashboardLayout activeSection="overview" breadcrumb="Operations / Response Operations" role="Response Officer"><div className="content response-operations-page"><div className="response-page-header"><div><p className="warning-eyebrow">Emergency Response Coordination</p><h1>Response Operations</h1><p className="subtitle">Coordinate emergency response teams, shelters and relief resources.</p><span>Active emergency-response incidents requiring coordination.</span></div><button className="btn response-refresh" onClick={retry}><RefreshCw size={14} /> Refresh operational data</button></div>{hasErrors && <div className="response-partial-warning"><AlertTriangle size={18} /><div><strong>Some operational data could not be loaded</strong><p>Available sections remain usable. Retry to refresh all dashboard data.</p></div><button className="btn cancel-btn" onClick={retry}>Retry</button></div>}<ResponseSummaryCards metrics={metrics} errors={errors} /><ActiveIncidentsTable incidents={activeIncidents} assignments={assignments} error={errors.incidents} assignmentError={errors.assignments} /><div className="response-lower-grid"><ResponseActivityPanel teams={teams} assignments={assignments} teamError={errors.teams} assignmentError={errors.assignments} /><CurrentAssignmentsPanel assignments={assignments} error={errors.assignments} /></div></div></DashboardLayout>
}
