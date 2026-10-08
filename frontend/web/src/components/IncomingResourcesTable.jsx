const formatEta = (eta) => eta
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(eta))
  : 'Not available'

export default function IncomingResourcesTable({ resources, onMarkDelivered, completingId }) {
  if (!resources.length) return <div className="state"><p>No incoming resources are currently scheduled.</p></div>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Resource / Item</th><th>Quantity</th><th>Owner / Source</th><th>Delivery resource</th><th>Status</th><th>ETA</th>{onMarkDelivered && <th>Action</th>}</tr></thead>
        <tbody>{resources.map((resource, index) => (
          <tr key={`${resource.item}-${index}`}>
            <td className="resource-name">{resource.item}</td>
            <td>{resource.quantity} {resource.unit}</td>
            <td>{resource.owner || <span className="muted">Not available</span>}</td>
            <td>{resource.deliveryResource || <span className="muted">Not assigned</span>}</td>
            <td><span className={`badge ${resource.status.toLowerCase().replaceAll(' ', '-')}`}>{resource.status}</span></td>
            <td>{formatEta(resource.eta)}</td>
            {onMarkDelivered && <td>{resource.distributionId && resource.status === 'EN_ROUTE'
              ? <button className="btn delivery-complete-btn" disabled={completingId === resource.distributionId} onClick={() => onMarkDelivered(resource)}>{completingId === resource.distributionId ? 'Updating…' : 'Mark Delivered'}</button>
              : <span className="muted">{resource.status === 'Delivered' ? 'Completed' : 'Not controlled here'}</span>}</td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
