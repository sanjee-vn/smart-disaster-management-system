import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, ArrowRight, Users } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import DeliveryResourceSelector from '../components/DeliveryResourceSelector'
import InventorySelector from '../components/InventorySelector'
import ValidationMessage from '../components/ValidationMessage'
import { getDeliveryResources, getInventory, getShelterById } from '../services/resourceCoordinationService'

export default function CreateDistributionPage() {
  const { shelterId } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const editDraft = state?.editDraft
  const [shelter, setShelter] = useState(null)
  const [inventory, setInventory] = useState([])
  const [deliveryResources, setDeliveryResources] = useState([])
  const [category, setCategory] = useState(editDraft?.category || '')
  const [itemName, setItemName] = useState(editDraft?.itemName || '')
  const [inventoryItemId, setInventoryItemId] = useState(editDraft?.inventoryItemId || '')
  const [quantity, setQuantity] = useState(editDraft?.quantity?.toString() || '')
  const [deliveryResourceId, setDeliveryResourceId] = useState(editDraft?.deliveryResourceId || '')
  const [eta, setEta] = useState(editDraft?.eta || '')
  const [notes, setNotes] = useState(editDraft?.notes || '')
  const [loading, setLoading] = useState(true)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [inventoryError, setInventoryError] = useState('')
  const [errors, setErrors] = useState({})

  const selectedInventory = useMemo(() => inventory.find((item) => item.id === inventoryItemId), [inventory, inventoryItemId])
  const selectedDelivery = useMemo(() => deliveryResources.find((resource) => resource.id === deliveryResourceId), [deliveryResources, deliveryResourceId])

  useEffect(() => {
    let active = true
    Promise.all([getShelterById(shelterId), getDeliveryResources(), editDraft?.category ? getInventory(editDraft.category) : Promise.resolve([])])
      .then(([shelterData, resourceData, inventoryData]) => { if (active) { setShelter(shelterData); setDeliveryResources(resourceData); setInventory(inventoryData) } })
      .catch((requestError) => { if (active) setPageError(requestError.response?.data?.message || 'Could not load the distribution form data.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [shelterId, editDraft?.category])

  const handleCategoryChange = async (nextCategory) => {
    setCategory(nextCategory)
    setItemName('')
    setInventoryItemId('')
    setQuantity('')
    setInventory([])
    setInventoryError('')
    setErrors((current) => ({ ...current, category: '', item: '', inventory: '', quantity: '' }))
    if (!nextCategory) return
    setInventoryLoading(true)
    try {
      setInventory(await getInventory(nextCategory))
    } catch (requestError) {
      setInventoryError(requestError.response?.data?.message || 'Could not load inventory for this category.')
    } finally {
      setInventoryLoading(false)
    }
  }

  const handleItemChange = (nextItemName) => {
    setItemName(nextItemName)
    setInventoryItemId('')
    setQuantity('')
    setErrors((current) => ({ ...current, item: '', inventory: '', quantity: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!category) nextErrors.category = 'Select a resource category.'
    if (!itemName) nextErrors.item = 'Select a resource item.'
    if (!selectedInventory) nextErrors.inventory = 'Select the inventory owner/source.'
    if (quantity === '') nextErrors.quantity = 'Enter the quantity to distribute.'
    else if (!Number.isFinite(Number(quantity))) nextErrors.quantity = 'Quantity must be a number.'
    else if (Number(quantity) <= 0) nextErrors.quantity = 'Quantity must be greater than 0.'
    else if (selectedInventory && Number(quantity) > selectedInventory.availableQuantity) nextErrors.quantity = `Quantity cannot exceed ${selectedInventory.availableQuantity} ${selectedInventory.unit}.`
    if (!selectedDelivery) nextErrors.deliveryResource = 'Select an available delivery vehicle or team.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const continueToReview = (event) => {
    event.preventDefault()
    if (!validate()) return
    const draft = {
      shelterId, shelterName: shelter.name, category,
      inventoryItemId: selectedInventory.id, itemName: selectedInventory.itemName,
      resourceOwnerId: selectedInventory.owner.id, resourceOwnerName: selectedInventory.owner.name, resourceOwnerType: selectedInventory.owner.type,
      availableQuantity: selectedInventory.availableQuantity, unit: selectedInventory.unit, quantity: Number(quantity),
      deliveryResourceId: selectedDelivery.id, deliveryResourceName: selectedDelivery.name, deliveryResourceType: selectedDelivery.type, deliveryResourceStatus: selectedDelivery.status,
      eta, notes: notes.trim(),
    }
    navigate('/resource-coordination/distributions/review', { state: { draft } })
  }

  if (loading) return <DashboardLayout><div className="content"><div className="state skeleton" aria-label="Loading distribution form" /></div></DashboardLayout>
  if (pageError || !shelter) return <DashboardLayout><div className="content"><div className="state error"><AlertTriangle size={26} /><h3>Unable to prepare distribution</h3><p>{pageError}</p><button className="btn btn-secondary" onClick={() => navigate('/resource-coordination')}>Back to dashboard</button></div></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="content create-page">
        <button className="back-link" onClick={() => navigate('/resource-coordination')}><ArrowLeft size={15} /> Resource Coordination</button>
        <div className="page-heading"><div><h1>Log New Distribution</h1><p className="subtitle">Prepare a relief supply distribution for review.</p></div><span className="draft-badge">Draft · Not saved</span></div>

        <section className="shelter-context">
          <div className="context-icon"><Users size={22} /></div><div className="context-main"><span>Distributing to</span><h2>{shelter.name}</h2><p>{shelter.district} District</p></div>
          <div className="context-stat"><span>Occupancy</span><strong>{shelter.occupancy} / {shelter.capacity}</strong></div>
          <div className="context-stat"><span>Status</span><strong>{shelter.status}</strong></div>
          <div className="context-requests"><span>Pending relief requests</span><strong>{shelter.pendingRequests.length ? shelter.pendingRequests.map((request) => `${request.item} · ${request.quantity} ${request.unit}`).join('  |  ') : 'No pending requests'}</strong></div>
        </section>

        <form onSubmit={continueToReview} noValidate>
          <InventorySelector category={category} inventory={inventory} selectedItemName={itemName} selectedInventoryId={inventoryItemId} loading={inventoryLoading} errors={errors} onCategoryChange={handleCategoryChange} onItemChange={handleItemChange} onInventoryChange={(id) => { setInventoryItemId(id); setQuantity(''); setErrors((current) => ({ ...current, inventory: '', quantity: '' })) }} />
          {inventoryError && <div className="api-inline-error"><AlertTriangle size={15} />{inventoryError}</div>}

          <section className="form-card">
            <div className="form-card-title"><span className="step-number">2</span><div><h2>Distribution Quantity</h2><p>Enter an amount within the selected source's available stock.</p></div></div>
            <div className="form-grid two-columns"><div className="field"><label htmlFor="quantity">Quantity <em>*</em></label><div className="input-with-unit"><input id="quantity" type="number" min="1" step="1" value={quantity} disabled={!selectedInventory} placeholder="Enter quantity" onChange={(event) => { setQuantity(event.target.value); setErrors((current) => ({ ...current, quantity: '' })) }} /><span>{selectedInventory?.unit || 'units'}</span></div><ValidationMessage message={errors.quantity} /></div><div className="quantity-help"><span>Maximum available</span><strong>{selectedInventory ? `${selectedInventory.availableQuantity.toLocaleString()} ${selectedInventory.unit}` : '—'}</strong></div></div>
          </section>

          <DeliveryResourceSelector resources={deliveryResources} selectedId={deliveryResourceId} loading={false} error={errors.deliveryResource} onChange={(id) => { setDeliveryResourceId(id); setErrors((current) => ({ ...current, deliveryResource: '' })) }} />

          <section className="form-card">
            <div className="form-card-title"><span className="step-number">4</span><div><h2>Schedule & Notes</h2><p>Add optional delivery timing and operational instructions.</p></div></div>
            <div className="form-grid two-columns"><div className="field"><label htmlFor="eta">Estimated Time of Arrival <span>(Optional)</span></label><input id="eta" type="datetime-local" value={eta} onChange={(event) => setEta(event.target.value)} /></div><div className="field"><label htmlFor="notes">Notes <span>(Optional)</span></label><textarea id="notes" rows="3" maxLength="500" placeholder="Handling instructions or contact details" value={notes} onChange={(event) => setNotes(event.target.value)} /></div></div>
          </section>

          <div className="form-actions"><button type="button" className="btn cancel-btn" onClick={() => navigate('/resource-coordination')}>Cancel</button><div><span>No inventory will be changed yet</span><button type="submit" className="btn continue-btn">Continue to Review <ArrowRight size={15} /></button></div></div>
        </form>
      </div>
    </DashboardLayout>
  )
}
