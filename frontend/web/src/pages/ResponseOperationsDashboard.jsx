import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import ActiveIncidentsTable from '../components/ActiveIncidentsTable'
import CurrentAssignmentsPanel from '../components/CurrentAssignmentsPanel'
import DashboardLayout from '../components/DashboardLayout'
import ResponseActivityPanel from '../components/ResponseActivityPanel'
import ResponseSummaryCards from '../components/ResponseSummaryCards'
import ResourceAllocationDashboardContent from '../components/ResourceAllocationDashboardContent'
import useResponseOperationsDashboard from '../hooks/useResponseOperationsDashboard'

export default function ResponseOperationsDashboard() {
  const { search } = useLocation()
  const requestedArea = new URLSearchParams(search).get('area')
  const entryArea = requestedArea === 'resources' || requestedArea === 'monitoring' ? requestedArea : 'planning'
  const entryCopy = entryArea === 'resources'
    ? { eyebrow: 'District Resource Operations', title: 'Resource Allocation', subtitle: 'Select an active incident to coordinate shelters, inventory and relief distributions.' }
    : entryArea === 'monitoring'
      ? { eyebrow: 'Live Operational Oversight', title: 'Response Monitoring', subtitle: 'Select an active incident to monitor teams, shelters, distributions and resolution eligibility.' }
      : { eyebrow: 'Emergency Response Coordination', title: 'Response Operations', subtitle: 'Coordinate emergency response teams, shelters and relief resources.' }
  const { incidents, assignments, teams, shelters, distributions, inventory, deliveryResources, errors, loading, retry } = useResponseOperationsDashboard(entryArea === 'resources')
  if (loading) return <DashboardLayout activeSection="overview" breadcrumb="Operations / Response Operations" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading response operations" /></div></DashboardLayout>

  const activeIncidents = incidents.filter((incident) => incident.status !== 'RESOLVED')
  const metrics = {
    activeIncidents: activeIncidents.length,
    plannedResponses: assignments.filter((assignment) => assignment.status === 'PLANNED').length,
    availableTeams: teams.filter((team) => team.status === 'AVAILABLE').length,
    deployedTeams: teams.filter((team) => team.status === 'DEPLOYED').length,
    activeShelters: shelters.filter((shelter) => shelter.status?.toLowerCase() !== 'inactive').length,
  }
  const hasErrors = Object.keys(errors).length > 0

  return <DashboardLayout activeSection="overview" breadcrumb={`Operations / ${entryCopy.title}`} role="Response Officer"><div className="content response-operations-page"><div className="response-page-header"><div><p className="warning-eyebrow">{entryCopy.eyebrow}</p><h1>{entryCopy.title}</h1><p className="subtitle">{entryCopy.subtitle}</p><span>Choose from active emergency-response incidents; no legacy unscoped workflow is used.</span></div><button className="btn response-refresh" onClick={retry}><RefreshCw size={14} /> Refresh operational data</button></div>{hasErrors && <div className="response-partial-warning"><AlertTriangle size={18} /><div><strong>Some operational data could not be loaded</strong><p>Available sections remain usable. Retry to refresh all dashboard data.</p></div><button className="btn cancel-btn" onClick={retry}>Retry</button></div>}{entryArea === 'resources' ? <ResourceAllocationDashboardContent incidents={incidents} assignments={assignments} shelters={shelters} distributions={distributions} inventory={inventory} deliveryResources={deliveryResources} errors={errors} /> : <><ResponseSummaryCards metrics={metrics} errors={errors} /><ActiveIncidentsTable incidents={activeIncidents} assignments={assignments} error={errors.incidents} assignmentError={errors.assignments} entryArea={entryArea} /><div className="response-lower-grid"><ResponseActivityPanel teams={teams} assignments={assignments} teamError={errors.teams} assignmentError={errors.assignments} /><CurrentAssignmentsPanel assignments={assignments} error={errors.assignments} entryArea={entryArea} /></div></>}</div></DashboardLayout>
}
