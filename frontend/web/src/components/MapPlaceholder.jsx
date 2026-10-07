import { MapPin } from 'lucide-react'

export default function MapPlaceholder({ shelter }) {
  return (
    <section className="panel">
      <div className="panel-header"><div><h2>Shelter Location</h2><p>Map preview · {shelter.district} District</p></div></div>
      <div className="map" role="img" aria-label={`Map placeholder for ${shelter.name}`}>
        <div className="map-road" />
        <div className="map-pin"><MapPin size={18} /></div>
        <div className="map-label">{shelter.name}</div>
      </div>
    </section>
  )
}
