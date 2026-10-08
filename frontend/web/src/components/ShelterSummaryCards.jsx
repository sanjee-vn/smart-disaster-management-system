import { BedDouble, Building2, CircleGauge, ClipboardList, Users } from 'lucide-react'

const cards = [
  ['activeShelters', 'Active Shelters', Building2],
  ['totalOccupancy', 'Total Occupancy', Users],
  ['totalCapacity', 'Total Capacity', BedDouble],
  ['availableSpaces', 'Available Spaces', CircleGauge],
  ['pendingRequests', 'Pending Requests', ClipboardList],
]

export default function ShelterSummaryCards({ metrics }) {
  return <section className="shelter-summary-cards" aria-label="Shelter coordination summary">{cards.map(([key, label, Icon]) => <article key={key}><span><Icon size={18} /></span><div><small>{label}</small><strong>{metrics[key].toLocaleString()}</strong></div></article>)}</section>
}
