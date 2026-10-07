import { Building2, PackageCheck, Truck, Users } from 'lucide-react'

const displayEta = (eta) => eta
  ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(eta))
  : 'Not specified'

export default function ReviewSummary({ draft, shelter, inventory, deliveryResource, remainingStock }) {
  const stockChanged = inventory && inventory.availableQuantity !== draft.availableQuantity
  return (
    <div className="review-grid">
      <section className="review-card">
        <div className="review-title"><Users size={18} /><h2>Shelter</h2></div>
        <dl><div><dt>Shelter name</dt><dd>{shelter.name}</dd></div><div><dt>District</dt><dd>{shelter.district}</dd></div><div><dt>Occupancy</dt><dd>{shelter.occupancy} / {shelter.capacity}</dd></div></dl>
      </section>
      <section className="review-card">
        <div className="review-title"><Building2 size={18} /><h2>Resource & Source</h2></div>
        <dl><div><dt>Category</dt><dd>{draft.category}</dd></div><div><dt>Item</dt><dd>{inventory?.itemName || draft.itemName}</dd></div><div><dt>Owner / source</dt><dd>{inventory?.owner.name || draft.resourceOwnerName}</dd></div><div><dt>Owner type</dt><dd>{inventory?.owner.type.replaceAll('_', ' ') || draft.resourceOwnerType.replaceAll('_', ' ')}</dd></div></dl>
      </section>
      <section className="review-card inventory-review">
        <div className="review-title"><PackageCheck size={18} /><h2>Inventory Check</h2>{stockChanged && <span className="review-updated">Updated</span>}</div>
        <div className="stock-comparison"><div><span>Current available stock</span><strong>{inventory ? `${inventory.availableQuantity.toLocaleString()} ${inventory.unit}` : 'Unavailable'}</strong></div><div className="requested"><span>Requested quantity</span><strong>{Number(draft.quantity).toLocaleString()} {inventory?.unit || draft.unit}</strong></div><div className={remainingStock < 0 ? 'negative' : 'remaining'}><span>Expected remaining stock</span><strong>{remainingStock === null ? 'Cannot calculate' : `${remainingStock.toLocaleString()} ${inventory?.unit || draft.unit}`}</strong></div></div>
      </section>
      <section className="review-card">
        <div className="review-title"><Truck size={18} /><h2>Delivery</h2></div>
        <dl><div><dt>Resource</dt><dd>{deliveryResource?.name || draft.deliveryResourceName}</dd></div><div><dt>Type</dt><dd>{deliveryResource?.type || draft.deliveryResourceType}</dd></div><div><dt>Availability</dt><dd><span className={`review-status ${(deliveryResource?.status || 'IN_USE').toLowerCase()}`}>{deliveryResource?.status || 'NOT FOUND'}</span></dd></div><div><dt>ETA</dt><dd>{displayEta(draft.eta)}</dd></div></dl>
      </section>
      {draft.notes && <section className="review-card notes-review"><div className="review-title"><h2>Additional Notes</h2></div><p>{draft.notes}</p></section>}
    </div>
  )
}
