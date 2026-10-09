const formatEta = (eta) => eta
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Colombo' }).format(new Date(eta))
  : 'Not available'

const activityLabel = (status) => {
  if (status === 'PENDING') return 'Pending staff acceptance'
  if (status === 'EN_ROUTE') return 'Accepted · In delivery'
  if (status === 'Delivered' || status === 'DELIVERED') return 'Completed'
  return 'Read-only'
}

export default function IncomingResourcesTable({ resources }) {
  if (!resources.length) return <div className="state"><p>No incoming resources are currently scheduled.</p></div>
  return (
    <div className="table-wrap">
      <table className="incoming-resources-table has-actions">
        <thead><tr><th>Resource / Item</th><th>Quantity</th><th>Owner / Source</th><th>Delivery resource</th><th>Status</th><th>ETA</th><th>Activity</th></tr></thead>
        <tbody>{resources.map((resource, index) => (
          <tr key={`${resource.item}-${index}`}>
            <td className="resource-name">{resource.item}</td>
            <td>{resource.quantity} {resource.unit}</td>
            <td>{resource.owner || <span className="muted">Not available</span>}</td>
            <td>{resource.deliveryResource || <span className="muted">Not assigned</span>}</td>
            <td><span className={`badge ${resource.status.toLowerCase().replaceAll(' ', '-')}`}>{resource.status}</span></td>
            <td>{formatEta(resource.eta)}</td>
            <td><span className="muted">{activityLabel(resource.status)}</span></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
