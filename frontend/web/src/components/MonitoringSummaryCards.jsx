import { Building2, PackageCheck, TentTree, Users } from 'lucide-react'

export default function MonitoringSummaryCards({ metrics }) {
  const cards = [
    ['teamsAssigned', 'Teams assigned', Users], ['teamsDeployed', 'Teams deployed', Users],
    ['activeShelters', 'Active shelters', TentTree], ['occupancy', 'Shelter occupancy', Building2],
    ['capacity', 'Shelter capacity', Building2], ['pendingRequests', 'Pending requests', PackageCheck],
    ['enRoute', 'Distributions en route', PackageCheck], ['completed', 'Completed distributions', PackageCheck],
  ]
  return <section className="monitoring-summary-grid">{cards.map(([key, label, Icon]) => <article key={key}><Icon size={17} /><span>{label}</span><strong>{metrics[key].toLocaleString()}</strong></article>)}</section>
}
