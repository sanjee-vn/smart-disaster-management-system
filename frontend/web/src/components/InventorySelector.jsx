import { PackageCheck } from 'lucide-react'
import ValidationMessage from './ValidationMessage'

export default function InventorySelector({ category, inventory, selectedItemName, selectedInventoryId, recommendedCategories = [], loading, errors, onCategoryChange, onItemChange, onInventoryChange }) {
  const itemNames = [...new Set(inventory.map((item) => item.itemName))]
  const sources = inventory.filter((item) => item.itemName === selectedItemName)
  const selectedInventory = inventory.find((item) => item.id === selectedInventoryId)
  const categories = ['Water', 'Food', 'Medicine'].sort((left, right) => Number(recommendedCategories.includes(right)) - Number(recommendedCategories.includes(left)))

  return (
    <section className="form-card">
      <div className="form-card-title"><span className="step-number">1</span><div><h2>Select Inventory</h2><p>Choose the relief item and the organization supplying it.</p></div></div>
      <div className="form-grid two-columns">
        <div className="field"><label htmlFor="category">Resource Category <em>*</em></label><select id="category" value={category} onChange={(event) => onCategoryChange(event.target.value)}><option value="">Select a category</option>{categories.map((name) => <option key={name} value={name}>{name}{recommendedCategories.includes(name) ? ' · Required in plan' : ''}</option>)}</select><ValidationMessage message={errors.category} />{recommendedCategories.length > 0 && <p className="field-hint">Planned categories are listed first. Additional operational needs remain available.</p>}</div>
        <div className="field"><label htmlFor="item">Resource Item <em>*</em></label><select id="item" value={selectedItemName} disabled={!category || loading || itemNames.length === 0} onChange={(event) => onItemChange(event.target.value)}><option value="">{loading ? 'Loading inventory…' : 'Select an item'}</option>{itemNames.map((name) => <option key={name}>{name}</option>)}</select><ValidationMessage message={errors.item} /></div>
      </div>

      {category && !loading && inventory.length === 0 && <div className="inline-empty">No inventory is available in the {category} category.</div>}

      {selectedItemName && <div className="source-section"><label>Resource Owner / Source <em>*</em></label><p className="field-hint">Select the exact stock source for this distribution.</p><div className="source-grid">{sources.map((item) => (
        <button type="button" key={item.id} className={`source-option ${selectedInventoryId === item.id ? 'selected' : ''}`} onClick={() => onInventoryChange(item.id)}>
          <span className="source-radio" /><span><strong>{item.owner.name}</strong><small>{item.owner.type.replaceAll('_', ' ')}</small></span><span className="stock"><b>{item.availableQuantity.toLocaleString()}</b>{item.unit} available</span>
        </button>
      ))}</div><ValidationMessage message={errors.inventory} /></div>}

      <div className={`stock-panel ${selectedInventory ? 'available' : ''}`}><PackageCheck size={21} /><div><span>Available stock</span><strong>{selectedInventory ? `${selectedInventory.availableQuantity.toLocaleString()} ${selectedInventory.unit}` : 'Select an inventory source'}</strong></div></div>
    </section>
  )
}
