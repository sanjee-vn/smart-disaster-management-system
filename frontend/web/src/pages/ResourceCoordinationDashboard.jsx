import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import IncomingResourcesTable from '../components/IncomingResourcesTable'
import MapPlaceholder from '../components/MapPlaceholder'
import ShelterCard from '../components/ShelterCard'
import { getShelterById, getShelters } from '../services/resourceCoordinationService'

const activeIncident = {
  name: 'Colombo District Flood Response',
  district: 'Colombo',
  hazardType: 'Flood',
  status: 'Active — Level 2',
}

export default function ResourceCoordinationDashboard() {
  const navigate = useNavigate()
  const [shelters, setShelters] = useState([])
  const [selectedShelter, setSelectedShelter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  const loadShelters = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getShelters()
      setShelters(data)
      setSelectedShelter(data[0] || null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load shelter data. Check that the API and MongoDB are running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getShelters()
      .then((data) => {
        if (!active) return
        setShelters(data)
        setSelectedShelter(data[0] || null)
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load shelter data. Check that the API and MongoDB are running.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

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

  return (
    <DashboardLayout>
      <div className="content">
        <div className="page-heading"><div><h1>Resource Coordination</h1><p className="subtitle">Monitor shelter demand and coordinate incoming relief supplies.</p></div><span className="updated">Operational dashboard</span></div>

        <section className="incident-banner">
          <div><div className="incident-kicker"><span className="pulse" /> Active incident</div><h2>{activeIncident.name}</h2></div>
          <div className="incident-meta">
            <div className="meta-item"><span>District</span><strong>{activeIncident.district}</strong></div>
            <div className="meta-item"><span>Hazard type</span><strong>{activeIncident.hazardType}</strong></div>
            <div className="meta-item"><span>Incident status</span><strong className="status-live">{activeIncident.status}</strong></div>
          </div>
        </section>

        <div className="section-head"><div><h2>Shelter Overview</h2><p>Select a shelter to review its supply pipeline.</p></div>{!loading && !error && <span className="count">{shelters.length} shelters</span>}</div>

        {loading && <div className="shelter-grid" aria-label="Loading shelters"><div className="state skeleton" /><div className="state skeleton" /><div className="state skeleton" /></div>}
        {!loading && error && <div className="state error"><AlertTriangle size={25} /><h3>Unable to load shelters</h3><p>{error}</p><button className="btn btn-primary" onClick={loadShelters}><RefreshCw size={12} /> Retry</button></div>}
        {!loading && !error && shelters.length === 0 && <div className="state"><h3>No shelters found</h3><p>There are no shelters assigned to the active incident yet.</p></div>}
        {!loading && !error && shelters.length > 0 && (
          <div className="shelter-grid">
            {shelters.map((shelter) => <ShelterCard key={shelter.id} shelter={shelter} selected={selectedShelter?.id === shelter.id} onSelect={() => selectShelter(shelter.id)} onLogDistribution={() => navigate(`/resource-coordination/distributions/new/${shelter.id}`)} />)}
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
                <div className="panel-header"><div><h2>Incoming Resources</h2><p>{selectedShelter.incomingResources.length} deliveries scheduled for this shelter</p></div><button className="btn btn-primary" onClick={() => navigate(`/resource-coordination/distributions/new/${selectedShelter.id}`)}>Log New Distribution</button></div>
                <IncomingResourcesTable resources={selectedShelter.incomingResources} />
              </section>
              <MapPlaceholder shelter={selectedShelter} />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
