import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import IncomingResourcesTable from '../components/IncomingResourcesTable'
import MapPlaceholder from '../components/MapPlaceholder'
import ResourceRequirementContext from '../components/ResourceRequirementContext'
import ShelterCard from '../components/ShelterCard'
import useIncidentResponseContext from '../hooks/useIncidentResponseContext'
import { getDistributions, getShelterById, getShelters, markDistributionDelivered } from '../services/resourceCoordinationService'
import { formatEnumLabel, getResponseOperationsPaths, getStandaloneResponseContext } from '../utils/responseOperationsRoutes'

export default function ResourceCoordinationDashboard() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { incidentId } = useParams()
  const { context: incidentContext, loading: contextLoading, error: contextError, reload: reloadContext } = useIncidentResponseContext(incidentId)
  const responseContext = incidentContext || getStandaloneResponseContext()
  const paths = getResponseOperationsPaths(incidentId)
  const [shelters, setShelters] = useState([])
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [completion, setCompletion] = useState({ distributionId: '', error: '', message: '' })
  const [distributions, setDistributions] = useState([])
  const [distributionError, setDistributionError] = useState('')

  const loadShelters = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getShelters(incidentId)
      setShelters(data)
      setSelectedShelter(data.find((shelter) => shelter.id === state?.selectedShelterId) || data[0] || null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load shelter data. Check that the API and MongoDB are running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getShelters(incidentId)
      .then((data) => {
        if (!active) return
        setShelters(data)
        setSelectedShelter(data.find((shelter) => shelter.id === state?.selectedShelterId) || data[0] || null)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load shelter data. Check that the API and MongoDB are running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [incidentId, state?.selectedShelterId])

  useEffect(() => {
    if (!incidentId) return
    let active = true
    getDistributions(incidentId)
      .then((data) => { if (active) { setDistributions(data); setDistributionError('') } })
      .catch((requestError) => { if (active) setDistributionError(requestError.response?.data?.error?.message || 'Distribution fulfilment status is unavailable.') })
    return () => { active = false }
  }, [incidentId])

  const selectShelter = async (id) => {
    setDetailLoading(true)
    setError('')
    try {
      setSelectedShelter(await getShelterById(id))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the selected shelter.')
    } finally {
      setDetailLoading(false)
    }
  }

  const completeDelivery = async (resource) => {
    if (!incidentId || !selectedShelter || !resource.distributionId) return
    if (!window.confirm(`Mark distribution ${resource.distributionId} as delivered? This will release its delivery resource.`)) return
    setCompletion({ distributionId: resource.distributionId, error: '', message: '' })
    try {
      await markDistributionDelivered(resource.distributionId, incidentId)
      const [shelterData, shelterList, distributionList] = await Promise.all([getShelterById(selectedShelter.id), getShelters(incidentId), getDistributions(incidentId)])
      setSelectedShelter(shelterData)
      setShelters(shelterList)
      setDistributions(distributionList)
      setCompletion({ distributionId: '', error: '', message: `${resource.distributionId} was marked delivered and its delivery resource is available.` })
    } catch (requestError) {
      setCompletion({ distributionId: '', error: requestError.response?.data?.error?.message || requestError.response?.data?.message || 'Could not complete this delivery.', message: '' })
    }
  }

  if (contextLoading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading incident response context" /></div></DashboardLayout>
  if (contextError) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={26} /><h3>Incident context unavailable</h3><p>{contextError}</p><button className="btn btn-primary" onClick={reloadContext}><RefreshCw size={12} /> Retry</button></div></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="content">
        <div className="page-heading"><div><h1>Resource Coordination</h1><p className="subtitle">Monitor shelter demand and coordinate incoming relief supplies.</p></div><span className="updated">Operational dashboard</span></div>

        {!incidentId && <div className="review-warning"><AlertTriangle size={20} /><div><strong>Standalone compatibility view</strong><p>Select an incident from Response Operations before logging a distribution.</p></div><button className="btn btn-secondary" onClick={() => navigate('/response-operations')}>Open Response Operations</button></div>}

        <section className={`incident-banner ${incidentId ? 'incident-aware' : ''}`}>
          <div><div className="incident-kicker"><span className="pulse" /> {incidentId ? 'Active incident' : 'Standalone resource view'}</div><h2>{incidentId ? responseContext.incidentName : 'Resource Coordination'}</h2></div>
          <div className="incident-meta">
            {incidentId && <><div className="meta-item"><span>Incident ID</span><strong>{responseContext.incidentId}</strong></div><div className="meta-item"><span>Warning ID</span><strong>{responseContext.warningId || 'Not linked'}</strong></div><div className="meta-item"><span>Response ID</span><strong>{responseContext.responseId || 'Not assigned'}</strong></div></>}
            <div className="meta-item"><span>District</span><strong>{incidentId ? responseContext.district : 'Not incident-scoped'}</strong></div>
            <div className="meta-item"><span>Hazard type</span><strong>{incidentId ? responseContext.hazardType : 'Not available'}</strong></div>
            {incidentId && <div className="meta-item"><span>Severity</span><strong>{formatEnumLabel(responseContext.severity)}</strong></div>}
            <div className="meta-item"><span>{incidentId ? 'Response status' : 'Mode'}</span><strong className="status-live">{incidentId ? formatEnumLabel(responseContext.responseStatus) : 'Unscoped shelter view'}</strong></div>
          </div>
        </section>

        {incidentId && <><ResourceRequirementContext requirements={responseContext.requiredCapabilities || state?.requiredCapabilities || []} distributions={distributions} />{distributionError && <div className="delivery-completion-message error"><AlertTriangle size={15} />{distributionError}</div>}</>}

        <div className="section-head"><div><h2>Shelter Overview</h2><p>Select a shelter to review its supply pipeline.</p></div>{!loading && !error && <span className="count">{shelters.length} shelters</span>}</div>

        {loading && <div className="shelter-grid" aria-label="Loading shelters"><div className="state skeleton" /><div className="state skeleton" /><div className="state skeleton" /></div>}
        {!loading && error && <div className="state error"><AlertTriangle size={25} /><h3>Unable to load shelters</h3><p>{error}</p><button className="btn btn-primary" onClick={loadShelters}><RefreshCw size={12} /> Retry</button></div>}
        {!loading && !error && shelters.length === 0 && <div className="state"><h3>No shelters found</h3><p>There are no shelters assigned to the active incident yet.</p></div>}
        {!loading && !error && shelters.length > 0 && (
          <div className="shelter-grid">
            {shelters.map((shelter) => <ShelterCard key={shelter.id} shelter={shelter} selected={selectedShelter?.id === shelter.id} onSelect={() => selectShelter(shelter.id)} onLogDistribution={incidentId ? () => navigate(paths.create(shelter.id), { state: { responseContext } }) : null} />)}
          </div>
        )}

        {selectedShelter && !error && (
          <>
            <div className="section-head"><div><h2>Selected Shelter Details</h2><p>{selectedShelter.name} · {selectedShelter.status} · {selectedShelter.occupancy} of {selectedShelter.capacity} occupied · {selectedShelter.pendingRequests.length} pending requests</p></div>{detailLoading && <span className="count">Refreshing…</span>}</div>
            <div className="detail-summary">
              <div><span>Occupancy</span><strong>{selectedShelter.occupancy} / {selectedShelter.capacity}</strong></div>
              <div><span>Status</span><strong>{selectedShelter.status}</strong></div>
              <div className="request-list"><span>Pending relief requests</span><strong>{selectedShelter.pendingRequests.length ? selectedShelter.pendingRequests.map((request) => `${request.item} (${request.quantity} ${request.unit})`).join(' · ') : 'No pending requests'}</strong></div>
            </div>
            <div className="details-grid">
              <section className="panel">
                <div className="panel-header"><div><h2>Incoming Resources</h2><p>{selectedShelter.incomingResources.length} deliveries scheduled for this shelter</p></div>{incidentId && <button className="btn btn-primary" onClick={() => navigate(paths.create(selectedShelter.id), { state: { responseContext } })}>Log New Distribution</button>}</div>
                {completion.error && <div className="delivery-completion-message error"><AlertTriangle size={15} />{completion.error}</div>}
                {completion.message && <div className="delivery-completion-message success">{completion.message}</div>}
                <IncomingResourcesTable resources={selectedShelter.incomingResources} onMarkDelivered={incidentId ? completeDelivery : undefined} completingId={completion.distributionId} />
              </section>
              <MapPlaceholder shelter={selectedShelter} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
