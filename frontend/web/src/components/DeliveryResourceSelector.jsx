import { MapPin, Truck } from 'lucide-react'
import ValidationMessage from './ValidationMessage'

export default function DeliveryResourceSelector({ resources, selectedId, loading, error, onChange }) {
  const availableCount = resources.filter((resource) => resource.status === 'AVAILABLE').length
  return (
    <section className="form-card">
      <div className="form-card-title"><span className="step-number">3</span><div><h2>Assign Delivery Resource</h2><p>Only available vehicles or teams can be assigned.</p></div></div>
      {loading && <div className="inline-empty">Loading delivery resources…</div>}
      {!loading && resources.length === 0 && <div className="inline-empty warning">No delivery resources are currently available.</div>}
      {!loading && resources.length > 0 && <div className="delivery-list">{resources.map((resource) => {
        const unavailable = resource.status !== 'AVAILABLE'
        return (
          <button type="button" key={resource.id} disabled={unavailable} className={`delivery-option ${selectedId === resource.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`} onClick={() => onChange(resource.id)}>
            <span className="delivery-icon"><Truck size={19} /></span><span className="delivery-copy"><strong>{resource.name}</strong><small>{resource.type} · <MapPin size={11} /> {resource.currentLocation}</small></span><span className={`availability ${unavailable ? 'busy' : ''}`}>{unavailable ? 'In use' : 'Available'}</span><span className="source-radio" />
          </button>
        )
      })}</div>}
      {!loading && resources.length > 0 && availableCount === 0 && <div className="inline-empty warning">No delivery vehicle or team can currently be selected.</div>}
      <ValidationMessage message={error} />
    </section>
  )
}
