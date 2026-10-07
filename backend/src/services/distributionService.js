const crypto = require("crypto");

// Inactive future transaction implementation. No route currently exposes this service.
const mongoose = require("mongoose");
const distributionRepository = require("../repositories/distributionRepository");
const shelterRepository = require("../repositories/shelterRepository");
const inventoryRepository = require("../repositories/inventoryRepository");
const deliveryResourceRepository = require("../repositories/deliveryResourceRepository");
const resourceOwnerRepository = require("../repositories/resourceOwnerRepository");

const errorWithCode = (code, message, status) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
};

const validateRequiredFields = ({ shelterId, inventoryItemId, quantity, deliveryResourceId }) => {
  if (!shelterId || !mongoose.isValidObjectId(shelterId)) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found.", 404);
  if (!inventoryItemId || !mongoose.isValidObjectId(inventoryItemId)) throw errorWithCode("INVENTORY_NOT_FOUND", "Inventory item was not found.", 404);
  if (quantity === undefined || quantity === null || quantity === "" || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
    throw errorWithCode("INVALID_QUANTITY", "Quantity must be greater than zero.", 400);
  }
  if (!deliveryResourceId || !mongoose.isValidObjectId(deliveryResourceId)) throw errorWithCode("DELIVERY_RESOURCE_NOT_FOUND", "Delivery resource was not found.", 404);
};

const toResponse = (distribution) => ({
  id: distribution._id.toString(),
  distributionId: distribution.distributionId,
  shelterId: distribution.shelterId.toString(),
  inventoryItemId: distribution.inventoryItemId.toString(),
  resourceOwnerId: distribution.resourceOwnerId.toString(),
  quantity: distribution.quantity,
  deliveryResourceId: distribution.deliveryResourceId.toString(),
  status: distribution.status,
  eta: distribution.eta || null,
  notes: distribution.notes || "",
  createdBy: distribution.createdBy,
  createdAt: distribution.createdAt,
});

const createDistribution = async (payload) => {
  validateRequiredFields(payload);
  const quantity = Number(payload.quantity);
  const requestId = payload.requestId || crypto.randomUUID();

  const existing = await distributionRepository.findByRequestId(requestId);
  if (existing) return toResponse(existing);

  const session = await mongoose.startSession();
  let createdDistribution;
  try {
    await session.withTransaction(async () => {
      const shelter = await shelterRepository.findByIdInSession(payload.shelterId, session);
      if (!shelter) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found.", 404);

      const inventory = await inventoryRepository.findByIdInSession(payload.inventoryItemId, session);
      if (!inventory) throw errorWithCode("INVENTORY_NOT_FOUND", "Inventory item was not found.", 404);
      const updatedInventory = await inventoryRepository.decrementAvailableStock(payload.inventoryItemId, quantity, session);
      if (!updatedInventory) throw errorWithCode("INSUFFICIENT_STOCK", "Inventory stock is insufficient.", 409);
      const resourceOwner = await resourceOwnerRepository.findByIdInSession(inventory.ownerId, session);
      if (!resourceOwner) throw errorWithCode("INVENTORY_NOT_FOUND", "Inventory owner was not found.", 404);

      const deliveryResource = await deliveryResourceRepository.findByIdInSession(payload.deliveryResourceId, session);
      if (!deliveryResource) throw errorWithCode("DELIVERY_RESOURCE_NOT_FOUND", "Delivery resource was not found.", 404);
      const reservedDeliveryResource = await deliveryResourceRepository.reserveAvailable(payload.deliveryResourceId, session);
      if (!reservedDeliveryResource) throw errorWithCode("DELIVERY_RESOURCE_UNAVAILABLE", "Delivery resource is no longer available.", 409);

      const distributionId = `DSP-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      createdDistribution = await distributionRepository.create({
        distributionId,
        requestId,
        shelterId: shelter._id,
        inventoryItemId: inventory._id,
        resourceOwnerId: inventory.ownerId,
        quantity,
        deliveryResourceId: deliveryResource._id,
        status: "EN_ROUTE",
        eta: payload.eta || undefined,
        notes: payload.notes || "",
        createdBy: "District Officer",
        createdAt: new Date(),
      }, session);

      const updatedShelter = await shelterRepository.addIncomingResource(shelter._id, {
        distributionId,
        item: inventory.itemName,
        quantity,
        unit: inventory.unit,
        owner: resourceOwner.name,
        deliveryResource: deliveryResource.name,
        status: "EN_ROUTE",
        eta: payload.eta || undefined,
      }, session);
      if (!updatedShelter) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found.", 404);
    });
    return toResponse(createdDistribution);
  } catch (error) {
    if (error.code && ["INVALID_QUANTITY", "SHELTER_NOT_FOUND", "INVENTORY_NOT_FOUND", "INSUFFICIENT_STOCK", "DELIVERY_RESOURCE_NOT_FOUND", "DELIVERY_RESOURCE_UNAVAILABLE"].includes(error.code)) throw error;
    const committed = await distributionRepository.findByRequestId(requestId).catch(() => null);
    if (committed) return toResponse(committed);
    throw errorWithCode("TRANSACTION_FAILED", "Distribution transaction could not be completed.", 500);
  } finally {
    await session.endSession();
  }
};

module.exports = { createDistribution };
