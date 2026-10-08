import { Activity, ArrowRight, CheckCircle2, Clock3, Download, House, MessageSquare, Siren, Smartphone, Users, X } from 'lucide-react'

const channelIcon = (channel) => {
  if (channel === 'SMS Alert') return MessageSquare
  if (channel === 'Audible / Siren') return Siren
  return Smartphone
}

const auditLabel = (event) => ({
  PUBLISHED: 'Warning recorded and queued',
  RETRY_QUEUED: event.message,
  ESCALATED: 'Marked for regional review',
  CANCELLED: 'Warning cancelled',
}[event.type] || event.message)

export default function DeliveryScreen(props) {
  const { Header, Badge, Button, MapPanel, issuedWarning, navigate, retryChannel, refreshData, setModal, setToast } = props
  const item = issuedWarning

  if (!item) {
    return <div className="empty-warning panel"><CheckCircle2 size={40}/><h2>No published warning selected</h2><p>Start the assessment workflow to create a warning.</p><Button variant="primary" onClick={() => navigate('dashboard', 'Dashboard')}>Return to dashboard</Button></div>
  }

  const deliveryChannels = item.deliveryChannels || []
  const auditEvents = [...(item.audit || [])].reverse().slice(0, 5)

  return <>
    <Header title="Warning Issued & Delivery Status" eyebrow="WARNING MONITORING · DELIVERY QUEUE" actions={<Badge tone={item.status}>{item.status}</Badge>} />
    <div className="summary-band delivery-band">
      <div><span>Warning ID</span><strong>{item.id}</strong></div>
      <div><span>Hazard ID</span><strong>{item.hazardId}</strong></div>
      <div><span>Warning level</span><Badge tone={item.level}>{item.level}</Badge></div>
      <div><span>Current status</span><Badge tone={item.status}>{item.status}</Badge></div>
    </div>
    <div className="api-status-banner"><span>Warning data is saved. No SMS, push, or siren delivery provider is connected in this build.</span></div>
    <div className="delivery-stats">
      <div><Users/><b>{item.target.toLocaleString()}</b><span>Total target citizens</span></div>
      <div><CheckCircle2/><b>{item.delivered.toLocaleString()}</b><span>Delivered</span></div>
      <div><Clock3/><b>{item.pending.toLocaleString()}</b><span>Pending</span></div>
      <div><X/><b>{item.failed.toLocaleString()}</b><span>Failed</span></div>
    </div>
    <div className="delivery-grid">
      <section className="panel delivery-table-panel">
        <div className="panel-heading"><div><h2>Delivery status by channel</h2><p>Recorded counts and retry requests</p></div><button className="icon-button" aria-label="Download delivery report" onClick={() => setToast('Delivery report is not available yet.')}><Download size={17}/></button></div>
        <div className="table-wrap"><table><thead><tr><th>Channel</th><th>Targeted</th><th>Delivered</th><th>Pending</th><th>Failed</th><th>Retry requests</th></tr></thead><tbody>
          {deliveryChannels.map((channel) => {
            const Icon = channelIcon(channel.channel)
            return <tr key={channel.channel}>
              <td><span className="hazard-type-icon"><Icon size={16}/>{channel.channel}</span></td>
              <td>{channel.target.toLocaleString()}</td>
              <td>{channel.delivered.toLocaleString()}</td>
              <td>{channel.pending.toLocaleString()}</td>
              <td>{channel.failed.toLocaleString()}</td>
              <td><button className="retry-link" disabled={item.status !== 'Published'} onClick={() => retryChannel(item.id, channel.channel)}>Queue retry ({channel.retryCount}) <ArrowRight size={13}/></button></td>
            </tr>
          })}
        </tbody></table></div>
        <div className="failed-summary"><b>Retry queue</b>{deliveryChannels.map((channel) => <div key={channel.channel}><span>{channel.channel} · {channel.retryCount} queued</span><Button variant="secondary-blue" disabled={item.status !== 'Published'} onClick={() => retryChannel(item.id, channel.channel)}>Queue retry</Button></div>)}</div>
      </section>
      <section className="panel coverage-panel"><div className="panel-heading"><div><h2>Geographic coverage</h2><p>Target areas selected for this warning</p></div></div><MapPanel compact pins={4}/><div className="coverage-legend"><i className="coverage-swatch"/> Affected areas <span>{item.areas.join(', ')}</span></div></section>
      <section className="panel audit-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Saved warning audit history</p></div></div><div className="timeline">
        {auditEvents.length ? auditEvents.map((event, index) => <div key={`${event.type}-${event.occurredAt}-${index}`}><i className={`timeline-dot ${event.type === 'CANCELLED' ? 'slate' : event.type === 'RETRY_QUEUED' ? 'amber' : 'blue'}`}/><span>{new Date(event.occurredAt).toLocaleString()}</span><p>{auditLabel(event)}</p></div>) : <p>No activity recorded.</p>}
      </div></section>
      <section className="panel escalation-panel"><div className="panel-heading"><div><h2>Escalation & cancellation</h2><p>Update the warning record</p></div></div>
        <p>{item.escalated ? 'This warning is marked for regional review.' : item.status === 'Cancelled' ? 'This warning has been cancelled.' : 'Mark this warning for review or cancel it if conditions improve.'}</p>
        <div><Button variant="secondary-blue" icon={ArrowRight} disabled={Boolean(item.escalated) || item.status === 'Cancelled'} onClick={() => setModal('escalate')}>{item.escalated ? 'Marked for review' : 'Mark for review'}</Button><Button variant="secondary" icon={X} disabled={item.status === 'Cancelled'} onClick={() => setModal('cancel-warning')}>Cancel warning</Button></div>
      </section>
    </div>
    <div className="workflow-actions delivery-actions"><Button variant="teal-button" icon={Activity} onClick={() => { void refreshData(); setToast('Refreshing warning records…') }}>Refresh status</Button><Button variant="primary" icon={House} onClick={() => navigate('dashboard', 'Dashboard')}>Return to dashboard</Button></div>
  </>
}
