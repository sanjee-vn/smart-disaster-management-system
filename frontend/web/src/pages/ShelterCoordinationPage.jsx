import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, Plus, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import SelectedShelterPanel from '../components/SelectedShelterPanel'
import ShelterCoordinationTable from '../components/ShelterCoordinationTable'
import ShelterSummaryCards from '../components/ShelterSummaryCards'
import StatusBadge from '../components/StatusBadge'
import useShelterCoordinationData from '../hooks/useShelterCoordinationData'
import ResourceRequirementContext from '../components/ResourceRequirementContext'
import { loadPlanningRequirements, normalizeRequirements, resourceRequirementCodes } from '../utils/responseRequirements'
import { registerShelter } from '../services/resourceCoordinationService'

const emptyShelter = (incident) => ({ name: '', district: incident?.district || '', address: '', capacity: '', occupancy: '0', status: 'Operational', latitude: '', longitude: '', contactPerson: '', contactNumber: '' })

export default function ShelterCoordinationPage() {
  const { incidentId } = useParams()
  const navigate = useNavigate()
  const { incident, assignment, shelters, loading, errors, notFound, retry } = useShelterCoordinationData(incidentId)
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [shelterForm, setShelterForm] = useState(() => emptyShelter(null))
  const [savingShelter, setSavingShelter] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [registrationMessage, setRegistrationMessage] = useState('')
  const currentSelectedShelter = shelters.find((shelter) => shelter.id === selectedShelter?.id) || null
  const assignmentRequirements = normalizeRequirements(assignment?.requiredCapabilities)
  const requiredCapabilities = assignmentRequirements.length ? assignmentRequirements : loadPlanningRequirements(incidentId)
  const hasReliefRequirement = requiredCapabilities.some((requirement) => resourceRequirementCodes.includes(requirement))
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
  const openRegistration = () => {
    setShelterForm(emptyShelter(incident)); setRegistrationError(''); setRegistrationMessage(''); setShowRegistration(true)
  }
  const submitShelter = async (event) => {
    event.preventDefault(); setSavingShelter(true); setRegistrationError(''); setRegistrationMessage('')
    try {
      const created = await registerShelter({ ...shelterForm, incidentId, capacity: Number(shelterForm.capacity), occupancy: Number(shelterForm.occupancy) })
      setRegistrationMessage(`${created.name} registered and assigned to ${incidentId}.`)
      setShowRegistration(false); setShelterForm(emptyShelter(incident)); await retry(); setSelectedShelter(created)
    } catch (error) {
      setRegistrationError(error.response?.data?.error?.message || error.response?.data?.message || 'Unable to register shelter.')
    } finally { setSavingShelter(false) }
  }
  const updateShelterField = (field, value) => setShelterForm((current) => ({ ...current, [field]: value }))

  return <DashboardLayout activeSection="incidents" breadcrumb="Response Operations / Shelter & Evacuation Coordination" role="Response Officer"><div className="content shelter-coordination-page"><button className="back-link" onClick={() => navigate('/response-operations')}><ArrowLeft size={15} /> Response Operations</button><header className="shelter-coordination-header"><div><p className="warning-eyebrow">Emergency Response · Shelter Operations</p><h1>Shelter &amp; Evacuation Coordination</h1><p className="subtitle">Register shelters, review capacity and continue into relief-resource coordination.</p><div className="warning-header-badges"><StatusBadge value={incident.severity} kind="severity" /><StatusBadge value={assignment?.status || incident.status} /></div><button type="button" className="btn register-shelter-btn" onClick={openRegistration}><Plus size={16}/> Register Shelter</button></div><div className="shelter-context-meta"><div><span>Incident ID</span><strong>{incident.incidentId}</strong></div><div><span>Affected area</span><strong>{incident.affectedArea || 'Not available'}</strong></div><div><span>Hazard</span><strong>{incident.hazardType}</strong></div><div><span>District</span><strong>{incident.district}</strong></div><div><span>Response ID</span><strong>{assignment?.responseId || 'No assignment'}</strong></div><div><span>Response status</span><strong>{assignment?.status || 'Not assigned'}</strong></div></div></header>{registrationMessage && <div className="request-action-message success"><CheckCircle2 size={16}/>{registrationMessage}</div>}{showRegistration && <section className="assignment-card shelter-registration-card"><div className="assignment-card-heading"><span><Building2 size={16}/></span><div><h2>Register Shelter</h2><p>The shelter will be assigned directly to {incidentId}.</p></div><button type="button" className="icon-action" aria-label="Close shelter registration" onClick={() => setShowRegistration(false)}><X size={18}/></button></div><form onSubmit={submitShelter}><div className="form-grid two-columns"><div className="field"><label htmlFor="shelterName">Shelter name <em>*</em></label><input id="shelterName" required value={shelterForm.name} onChange={(event) => updateShelterField('name', event.target.value)}/></div><div className="field"><label htmlFor="shelterDistrict">District <em>*</em></label><input id="shelterDistrict" required value={shelterForm.district} onChange={(event) => updateShelterField('district', event.target.value)}/></div><div className="field assignment-instructions"><label htmlFor="shelterAddress">Address / location <em>*</em></label><input id="shelterAddress" required value={shelterForm.address} onChange={(event) => updateShelterField('address', event.target.value)}/></div><div className="field"><label htmlFor="shelterStatus">Status</label><select id="shelterStatus" value={shelterForm.status} onChange={(event) => updateShelterField('status', event.target.value)}><option>Operational</option><option>Near Capacity</option><option>At Capacity</option><option>Inactive</option></select></div><div className="field"><label htmlFor="shelterCapacity">Maximum capacity <em>*</em></label><input id="shelterCapacity" type="number" min="1" step="1" required value={shelterForm.capacity} onChange={(event) => updateShelterField('capacity', event.target.value)}/></div><div className="field"><label htmlFor="shelterOccupancy">Current occupancy <em>*</em></label><input id="shelterOccupancy" type="number" min="0" step="1" required value={shelterForm.occupancy} onChange={(event) => updateShelterField('occupancy', event.target.value)}/></div><div className="field"><label htmlFor="shelterLatitude">Latitude</label><input id="shelterLatitude" type="number" min="-90" max="90" step="any" value={shelterForm.latitude} onChange={(event) => updateShelterField('latitude', event.target.value)}/></div><div className="field"><label htmlFor="shelterLongitude">Longitude</label><input id="shelterLongitude" type="number" min="-180" max="180" step="any" value={shelterForm.longitude} onChange={(event) => updateShelterField('longitude', event.target.value)}/></div><div className="field"><label htmlFor="shelterContactPerson">Contact person</label><input id="shelterContactPerson" value={shelterForm.contactPerson} onChange={(event) => updateShelterField('contactPerson', event.target.value)}/></div><div className="field"><label htmlFor="shelterContactNumber">Contact number</label><input id="shelterContactNumber" value={shelterForm.contactNumber} onChange={(event) => updateShelterField('contactNumber', event.target.value)}/></div></div>{registrationError && <div className="assignment-api-error"><AlertTriangle size={16}/><div><strong>Registration failed</strong><p>{registrationError}</p></div></div>}<div className="form-actions"><button type="button" className="btn cancel-btn" onClick={() => setShowRegistration(false)}>Cancel</button><button type="submit" className="btn continue-btn" disabled={savingShelter}>{savingShelter ? 'Registering…' : 'Save & Assign to Incident'}</button></div></form></section>}{errors.assignment && <div className="shelter-inline-warning"><AlertTriangle size={17} /><div><strong>Response assignment unavailable</strong><p>{errors.assignment} Shelter registration and coordination remain available.</p></div><button className="back-link" onClick={retry}><RefreshCw size={12} /> Retry</button></div>}<ResourceRequirementContext requirements={requiredCapabilities} compact />{assignment && !hasReliefRequirement && <div className="shelter-inline-warning"><ShieldAlert size={17} /><div><strong>No relief-resource requirement recorded</strong><p>This response can proceed directly to monitoring. Resource coordination remains available for new shelter needs.</p></div><button className="btn btn-secondary" onClick={() => navigate(`/response-operations/incidents/${incidentId}/monitoring`)}>Open Response Monitoring</button></div>}<ShelterSummaryCards metrics={metrics} /><section className="shelter-list-panel"><div className="shelter-list-heading"><div><Building2 size={18} /><div><h2>Incident Shelters</h2><p>Only shelters assigned to {incident.incidentId} are shown.</p></div></div><div className="shelter-heading-actions"><span>{shelters.length} shelter{shelters.length === 1 ? '' : 's'}</span><button type="button" className="btn register-shelter-btn" onClick={openRegistration}><Plus size={15}/> Register Shelter</button></div></div>{errors.shelters ? <div className="state error"><AlertTriangle size={24} /><h3>Unable to load shelters</h3><p>{errors.shelters}</p><button className="btn btn-primary" onClick={retry}><RefreshCw size={12} /> Retry</button></div> : shelters.length === 0 ? <div className="state"><Building2 size={25} /><h3>No shelters found</h3><p>Register the first shelter for this incident using the button above.</p><button type="button" className="btn register-shelter-btn" onClick={openRegistration}><Plus size={15}/> Register Shelter</button></div> : <ShelterCoordinationTable shelters={shelters} selectedId={currentSelectedShelter?.id} onSelect={setSelectedShelter} />}</section>{!errors.shelters && shelters.length > 0 && <SelectedShelterPanel shelter={currentSelectedShelter} onCoordinateResources={coordinateResources} onLogDistribution={logDistribution} />}</div></DashboardLayout>
}
