export const validateDistributionDraft = (draft, inventory, deliveryResource) => {
  const quantity = Number(draft?.quantity)
  return {
    quantityValid: Number.isFinite(quantity) && quantity > 0,
    inventoryExists: Boolean(inventory),
    stockSufficient: Boolean(inventory) && Number.isFinite(quantity) && quantity > 0 && quantity <= inventory.availableQuantity,
    deliveryResourceExists: Boolean(deliveryResource),
    deliveryResourceAvailable: deliveryResource?.status === 'AVAILABLE',
    remainingStock: inventory && Number.isFinite(quantity) ? inventory.availableQuantity - quantity : null,
  }
}

export const isDistributionValid = (validation) => validation.quantityValid
  && validation.inventoryExists
  && validation.stockSufficient
  && validation.deliveryResourceExists
  && validation.deliveryResourceAvailable
