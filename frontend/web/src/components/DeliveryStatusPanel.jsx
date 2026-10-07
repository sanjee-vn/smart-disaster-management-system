import { RadioTower } from 'lucide-react'
import StatusBadge from './StatusBadge'

export default function DeliveryStatusPanel({ channels }) {
  return (
    <section className="warning-card delivery-status-panel">
      <div className="warning-card-heading"><span className="warning-card-icon"><RadioTower size={18} /></span><div><h2>Delivery Status</h2><p>Demonstration channel outcomes; no external provider is connected.</p></div></div>
      <div className="delivery-demo-label">Demo delivery data</div>
      <div className="delivery-status-table" role="table" aria-label="Warning delivery channel status">
        <div className="delivery-status-row delivery-status-head" role="row"><span>Channel</span><span>Status</span><span>Description</span></div>
        {channels.map((item) => <div className="delivery-status-row" role="row" key={item.channel}><strong>{item.channel}</strong><span><StatusBadge value={item.status} /></span><p>{item.description}</p></div>)}
      </div>
    </section>
  )
}
