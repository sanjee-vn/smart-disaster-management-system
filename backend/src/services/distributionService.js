const crypto = require("crypto");
const mongoose = require("mongoose");
const distributionRepository = require("../repositories/distributionRepository");
const shelterRepository = require("../repositories/shelterRepository");
const inventoryRepository = require("../repositories/inventoryRepository");
const deliveryResourceRepository = require("../repositories/deliveryResourceRepository");
const resourceOwnerRepository = require("../repositories/resourceOwnerRepository");
const responseOperationsRepository = require("../repositories/responseOperationsRepository");

const errorWithCode = (code, message, status) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
};

const validateRequiredFields = ({ incidentId, shelterId, inventoryItemId, resourceOwnerId, quantity, deliveryResourceId, eta }) => {
  if (!incidentId || typeof incidentId !== "string") throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);
  if (!shelterId || !mongoose.isValidObjectId(shelterId)) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found.", 404);
  if (!inventoryItemId || !mongoose.isValidObjectId(inventoryItemId)) throw errorWithCode("INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.", 404);
  if (!resourceOwnerId || !mongoose.isValidObjectId(resourceOwnerId)) throw errorWithCode("RESOURCE_OWNER_NOT_FOUND", "Resource owner was not found.", 404);
  if (quantity === undefined || quantity === null || quantity === "" || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0) {
    throw errorWithCode("INVALID_QUANTITY", "Quantity must be greater than zero.", 400);
  }
  if (!deliveryResourceId || !mongoose.isValidObjectId(deliveryResourceId)) throw errorWithCode("DELIVERY_RESOURCE_NOT_FOUND", "Delivery resource was not found.", 404);
  if (eta !== undefined && eta !== null && eta !== "" && Number.isNaN(new Date(eta).getTime())) {
    throw errorWithCode("INVALID_ETA", "ETA must be a valid operational timestamp.", 400);
  }
};

const referenceId = (reference) => (reference?._id || reference)?.toString() || null;

const toResponse = (distribution, context = {}) => ({
  id: distribution._id.toString(),
  distributionId: distribution.distributionId,
  incidentId: context.incident?.incidentId || distribution.incidentId?.incidentId || null,
  responseId: context.responseAssignment?.responseId || distribution.responseAssignmentId?.responseId || null,
  shelterId: referenceId(distribution.shelterId),
  inventoryItemId: referenceId(distribution.inventoryItemId),
  resourceOwnerId: referenceId(distribution.resourceOwnerId),
  quantity: distribution.quantity,
  deliveryResourceId: referenceId(distribution.deliveryResourceId),
  status: distribution.status,
  deliveredAt: distribution.deliveredAt || null,
  eta: distribution.eta || null,
  notes: distribution.notes || "",
  createdBy: distribution.createdBy,
  issuedAt: distribution.issuedAt,
  createdAt: distribution.createdAt,
  incident: context.incident ? {
    incidentId: context.incident.incidentId,
    hazardType: context.incident.hazardType,
    district: context.incident.district,
  } : distribution.incidentId?.incidentId ? {
    incidentId: distribution.incidentId.incidentId,
    hazardType: distribution.incidentId.hazardType,
    district: distribution.incidentId.district,
  } : null,
  shelter: context.shelter ? {
    id: context.shelter._id.toString(), shelterId: context.shelter.shelterId,
    name: context.shelter.name, district: context.shelter.district,
  } : distribution.shelterId?.name ? {
    id: distribution.shelterId._id.toString(), shelterId: distribution.shelterId.shelterId,
    name: distribution.shelterId.name, district: distribution.shelterId.district,
  } : null,
  item: context.inventory ? {
    id: context.inventory._id.toString(), category: context.inventory.category,
    itemName: context.inventory.itemName, unit: context.inventory.unit,
  } : distribution.inventoryItemId?.itemName ? {
    id: distribution.inventoryItemId._id.toString(), category: distribution.inventoryItemId.category,
    itemName: distribution.inventoryItemId.itemName, unit: distribution.inventoryItemId.unit,
  } : null,
  resourceOwner: context.resourceOwner ? {
    id: context.resourceOwner._id.toString(), name: context.resourceOwner.name, type: context.resourceOwner.type,
  } : distribution.resourceOwnerId?.name ? {
    id: distribution.resourceOwnerId._id.toString(), name: distribution.resourceOwnerId.name, type: distribution.resourceOwnerId.type,
  } : null,
  deliveryResource: context.deliveryResource ? {
    id: context.deliveryResource._id.toString(), name: context.deliveryResource.name, type: context.deliveryResource.type,
  } : distribution.deliveryResourceId?.name ? {
    id: distribution.deliveryResourceId._id.toString(), name: distribution.deliveryResourceId.name, type: distribution.deliveryResourceId.type,
  } : null,
});

const isTransactionUnavailable = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("transaction numbers are only allowed on a replica set member or mongos")
    || message.includes("transactions are not supported")
    || message.includes("replica set");
};

const sameTimestamp = (left, right) => {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
};

const assertIdempotentReplay = (existing, payload) => {
  const sameRequest = existing.incidentId?.incidentId === payload.incidentId
    && (existing.responseAssignmentId?.responseId || null) === (payload.responseId || null)
    && referenceId(existing.shelterId) === payload.shelterId
    && referenceId(existing.inventoryItemId) === payload.inventoryItemId
    && referenceId(existing.resourceOwnerId) === payload.resourceOwnerId
    && referenceId(existing.deliveryResourceId) === payload.deliveryResourceId
    && Number(existing.quantity) === Number(payload.quantity)
    && sameTimestamp(existing.eta, payload.eta)
    && (existing.notes || "") === (payload.notes || "");
  if (!sameRequest) throw errorWithCode("IDEMPOTENCY_CONFLICT", "This request ID was already used for a different distribution payload.", 409);
};

const createDistribution = async (payload) => {
  validateRequiredFields(payload);
  const quantity = Number(payload.quantity);
  const requestId = payload.requestId || crypto.randomUUID();

  let existing;
  try {
    existing = await distributionRepository.findByRequestId(requestId);
  } catch {
    throw errorWithCode("DISTRIBUTION_COMMIT_FAILED", "Distribution could not be committed atomically.", 500);
  }
  if (existing) {
    assertIdempotentReplay(existing, payload);
    return toResponse(existing);
  }

  let session;
  let createdDistribution;
  let committedContext;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const incident = await responseOperationsRepository.findIncidentForDispatch(payload.incidentId, session);
      if (!incident) throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);

      let responseAssignment = null;
      if (payload.responseId) {
        responseAssignment = await responseOperationsRepository.findAssignmentForDispatch(payload.responseId, session);
        if (!responseAssignment || responseAssignment.incidentId.toString() !== incident._id.toString()) {
          throw errorWithCode("RESPONSE_ASSIGNMENT_NOT_FOUND", "Response assignment was not found for this incident.", 404);
        }
      }

      const shelter = await shelterRepository.findByIdInSession(payload.shelterId, session);
      if (!shelter) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found.", 404);
      if (shelter.incidentId !== incident.incidentId) throw errorWithCode("SHELTER_NOT_FOUND", "Shelter was not found for this incident.", 404);

      const inventory = await inventoryRepository.findByIdInSession(payload.inventoryItemId, session);
      if (!inventory) throw errorWithCode("INVENTORY_ITEM_NOT_FOUND", "Inventory item was not found.", 404);
      const resourceOwner = await resourceOwnerRepository.findByIdInSession(payload.resourceOwnerId, session);
      if (!resourceOwner) throw errorWithCode("RESOURCE_OWNER_NOT_FOUND", "Resource owner was not found.", 404);
      if (inventory.ownerId.toString() !== resourceOwner._id.toString()) {
        throw errorWithCode("RESOURCE_OWNER_NOT_FOUND", "Inventory item does not belong to the selected resource owner.", 400);
      }
      if (inventory.availableQuantity < quantity) throw errorWithCode("INSUFFICIENT_STOCK", "Inventory stock changed and is now insufficient.", 409);

      const deliveryResource = await deliveryResourceRepository.findByIdInSession(payload.deliveryResourceId, session);
      if (!deliveryResource) throw errorWithCode("DELIVERY_RESOURCE_NOT_FOUND", "Delivery resource was not found.", 404);
      if (deliveryResource.status !== "AVAILABLE") throw errorWithCode("DELIVERY_RESOURCE_UNAVAILABLE", "Delivery resource is no longer available.", 409);

      const updatedInventory = await inventoryRepository.decrementAvailableStock(payload.inventoryItemId, quantity, session);
      if (!updatedInventory) throw errorWithCode("INVENTORY_CONFLICT", "Inventory changed while the distribution was being processed.", 409);
      const reservedDeliveryResource = await deliveryResourceRepository.reserveAvailable(payload.deliveryResourceId, session);
      if (!reservedDeliveryResource) throw errorWithCode("DELIVERY_RESOURCE_CONFLICT", "Delivery resource changed while the distribution was being processed.", 409);

      const now = new Date();
      const distributionId = `DST-${now.getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
      createdDistribution = await distributionRepository.create({
        distributionId,
        requestId,
        incidentId: incident._id,
        responseAssignmentId: responseAssignment?._id || null,
        shelterId: shelter._id,
        inventoryItemId: inventory._id,
        resourceOwnerId: resourceOwner._id,
        quantity,
        deliveryResourceId: deliveryResource._id,
        status: "EN_ROUTE",
        eta: payload.eta || undefined,
        notes: payload.notes || "",
        createdBy: "District Officer",
        issuedAt: now,
        createdAt: now,
      }, session);
      committedContext = { incident, responseAssignment, shelter, inventory, resourceOwner, deliveryResource };

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
    return toResponse(createdDistribution, committedContext);
  } catch (error) {
    const domainCodes = ["INCIDENT_NOT_FOUND", "RESPONSE_ASSIGNMENT_NOT_FOUND", "SHELTER_NOT_FOUND", "INVENTORY_ITEM_NOT_FOUND", "RESOURCE_OWNER_NOT_FOUND", "INVALID_QUANTITY", "INSUFFICIENT_STOCK", "DELIVERY_RESOURCE_NOT_FOUND", "DELIVERY_RESOURCE_UNAVAILABLE", "INVALID_ETA", "INVENTORY_CONFLICT", "DELIVERY_RESOURCE_CONFLICT"];
    if (error.code && domainCodes.includes(error.code)) throw error;
    if (isTransactionUnavailable(error)) {
      throw errorWithCode("TRANSACTION_UNAVAILABLE", "Atomic distribution processing requires MongoDB transaction support.", 503);
    }
    if (error.code === 11000) {
      const committed = await distributionRepository.findByRequestId(requestId).catch(() => null);
      if (committed) {
        assertIdempotentReplay(committed, payload);
        return toResponse(committed);
      }
    }
    throw errorWithCode("DISTRIBUTION_COMMIT_FAILED", "Distribution could not be committed atomically.", 500);
  } finally {
    if (session) await session.endSession();
  }
};

const getDistributions = async ({ incidentId } = {}) => {
  if (!incidentId || typeof incidentId !== "string") throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);
  const incident = await responseOperationsRepository.findIncidentForDispatch(incidentId);
  if (!incident) throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);
  return (await distributionRepository.findByIncidentId(incident._id)).map((distribution) => toResponse(distribution));
};

const markDistributionDelivered = async (distributionId, { incidentId } = {}) => {
  if (!distributionId || typeof distributionId !== "string") {
    throw errorWithCode("DISTRIBUTION_NOT_FOUND", "Distribution was not found.", 404);
  }
  if (!incidentId || typeof incidentId !== "string") {
    throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);
  }

  let session;
  try {
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const incident = await responseOperationsRepository.findIncidentForDispatch(incidentId, session);
      if (!incident) throw errorWithCode("INCIDENT_NOT_FOUND", "Incident was not found.", 404);

      const distribution = await distributionRepository.findForCompletion(distributionId, incident._id, session);
      if (!distribution) throw errorWithCode("DISTRIBUTION_NOT_FOUND", "Distribution was not found for this incident.", 404);
      if (distribution.status === "DELIVERED") {
        throw errorWithCode("DISTRIBUTION_ALREADY_DELIVERED", "Distribution has already been marked as delivered.", 409);
      }
      if (distribution.status !== "EN_ROUTE") {
        throw errorWithCode("INVALID_DISTRIBUTION_TRANSITION", `Distribution cannot transition from ${distribution.status} to DELIVERED.`, 409);
      }

      const deliveredAt = new Date();
      const delivered = await distributionRepository.markDelivered(distribution._id, deliveredAt, session);
      if (!delivered) throw errorWithCode("DISTRIBUTION_STATUS_CONFLICT", "Distribution status changed before delivery completion.", 409);

      const released = await deliveryResourceRepository.releaseInUse(distribution.deliveryResourceId, session);
      if (!released) throw errorWithCode("DELIVERY_RESOURCE_CONFLICT", "Associated delivery resource is not currently in use.", 409);

      const shelterUpdated = await shelterRepository.markIncomingResourceDelivered(distribution.shelterId, distribution.distributionId, session);
      if (!shelterUpdated) throw errorWithCode("SHELTER_RESOURCE_NOT_FOUND", "Shelter incoming-resource record was not found for this distribution.", 409);
    });
    const completed = await distributionRepository.findByDistributionId(distributionId);
    if (!completed) throw errorWithCode("DISTRIBUTION_NOT_FOUND", "Completed distribution could not be loaded.", 404);
    return toResponse(completed);
  } catch (error) {
    const domainCodes = ["INCIDENT_NOT_FOUND", "DISTRIBUTION_NOT_FOUND", "DISTRIBUTION_ALREADY_DELIVERED", "INVALID_DISTRIBUTION_TRANSITION", "DISTRIBUTION_STATUS_CONFLICT", "DELIVERY_RESOURCE_CONFLICT", "SHELTER_RESOURCE_NOT_FOUND"];
    if (error.code && domainCodes.includes(error.code)) throw error;
    if (isTransactionUnavailable(error)) {
      throw errorWithCode("TRANSACTION_UNAVAILABLE", "Atomic delivery completion requires MongoDB transaction support.", 503);
    }
    throw errorWithCode("DELIVERY_COMPLETION_FAILED", "Delivery completion could not be committed atomically.", 500);
  } finally {
    if (session) await session.endSession();
  }
};

module.exports = { createDistribution, getDistributions, markDistributionDelivered };
