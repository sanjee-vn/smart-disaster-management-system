import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Building2, RefreshCw, ShieldAlert } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import SelectedShelterPanel from '../components/SelectedShelterPanel'
import ShelterCoordinationTable from '../components/ShelterCoordinationTable'
import ShelterSummaryCards from '../components/ShelterSummaryCards'
import StatusBadge from '../components/StatusBadge'
import useShelterCoordinationData from '../hooks/useShelterCoordinationData'
import ResourceRequirementContext from '../components/ResourceRequirementContext'
import { loadPlanningRequirements, normalizeRequirements } from '../utils/responseRequirements'

export default function ShelterCoordinationPage() {
  const { incidentId } = useParams()
  const navigate = useNavigate()
  const { incident, assignment, shelters, loading, errors, notFound, retry } = useShelterCoordinationData(incidentId)
  const [selectedShelter, setSelectedShelter] = useState(null)
  const currentSelectedShelter = shelters.find((shelter) => shelter.id === selectedShelter?.id) || null
  const assignmentRequirements = normalizeRequirements(assignment?.requiredCapabilities)
  const requiredCapabilities = assignmentRequirements.length ? assignmentRequirements : loadPlanningRequirements(incidentId)
  const metrics = useMemo(() => shelters.reduce((totals, shelter) => {
    const occupancy = Number(shelter.occupancy) || 0
    const capacity = Number(shelter.capacity) || 0
    if (shelter.status?.toLowerCase() !== 'inactive') totals.activeShelters += 1
    totals.totalOccupancy += occupancy
    totals.totalCapacity += capacity
    totals.availableSpaces += Math.max(0, capacity - occupancy)
    totals.pendingRequests += shelter.pendingRequests?.length || 0
    return totals
  }, { activeShelters: 0, totalOccupancy: 0, totalCapacity: 0, availableSpaces: 0, pendingRequests: 0 }), [shelters])

  if (!incidentId) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={27} /><h3>Incident ID is missing</h3><p>Open Shelter Coordination from a valid incident workflow.</p></div></div></DashboardLayout>
  if (loading) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state skeleton" aria-label="Loading shelter coordination" /></div></DashboardLayout>
  if (notFound) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state"><ShieldAlert size={28} /><h3>Incident not found</h3><p>No incident exists for {incidentId}.</p><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Back to Response Operations</button></div></div></DashboardLayout>
  if (errors.incident || !incident) return <DashboardLayout activeSection="incidents" role="Response Officer"><div className="content"><div className="state error"><AlertTriangle size={28} /><h3>Unable to load incident</h3><p>{errors.incident || 'Incident data is unavailable.'}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={14} /> Retry</button></div></div></DashboardLayout>

  const coordinateResources = () => navigate(`/response-operations/incidents/${incidentId}/resources`, { state: { selectedShelterId: currentSelectedShelter.id, requiredCapabilities } })
  const logDistribution = () => navigate(`/response-operations/incidents/${incidentId}/resources/new/${currentSelectedShelter.id}`, { state: { responseContext: { requiredCapabilities } } })

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Shelter & Evacuation Coordination" role="Response Officer"><div className="content shelter-coordination-page"><button className="back-link" onClick={() => navigate('/response-operations')}><ArrowLeft size={15} /> Response Operations</button><header className="shelter-coordination-header"><div><p className="warning-eyebrow">Emergency Response · Shelter Operations</p><h1>Shelter &amp; Evacuation Coordination</h1><p className="subtitle">Review shelter capacity and continue into relief-resource coordination.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={assignment?.status || incident.status} /></div></div><div className="shelter-context-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Affected area</span><strong>{incident.affectedArea || 'Not available'}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>District</span><strong>{incident.district}</strong></div><div><span>Response ID</span><strong>{assignment?.responseId || 'No assignment'}</strong></div><div><span>Response status</span><strong>{assignment?.status || 'Not assigned'}</strong></div></div></header>{errors.assignment && <div className="shelter-inline-warning"><AlertTriangle size={17} /><div><strong>Response assignment unavailable</strong><p>{errors.assignment} Shelter coordination remains read-only and available.</p></div><button className="back-link" onClick={retry}><RefreshCw size={12} /> Retry</button></div>}<ResourceRequirementContext requirements={requiredCapabilities} compact /><ShelterSummaryCards metrics={metrics} /><section className="shelter-list-panel"><div className="shelter-list-heading"><div><Building2 size={18} /><div><h2>Incident Shelters</h2><p>Only shelters assigned to {incident.incidentId} are shown.</p></div></div><span>{shelters.length} shelter{shelters.length === 1 ? '' : 's'}</span></div>{errors.shelters ? <div className="state error"><AlertTriangle size={24} /><h3>Unable to load shelters</h3><p>{errors.shelters}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={12} /> Retry</button></div> : shelters.length === 0 ? <div className="state"><Building2 size={25} /><h3>No shelters found</h3><p>No shelters are currently assigned to this incident.</p></div> : <ShelterCoordinationTable shelters={shelters} selectedId={currentSelectedShelter?.id} onSelect={setSelectedShelter} />}</section>{!errors.shelters && shelters.length > 0 && <SelectedShelterPanel shelter={currentSelectedShelter} onCoordinateResources={coordinateResources} onLogDistribution={logDistribution} />}</div></DashboardLayout>
}
