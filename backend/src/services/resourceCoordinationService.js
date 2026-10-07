const mongoose = require("mongoose");
const shelterRepository = require("../repositories/shelterRepository");
const inventoryRepository = require("../repositories/inventoryRepository");
const deliveryResourceRepository = require("../repositories/deliveryResourceRepository");

const toResponse = (shelter) => ({
  id: shelter._id.toString(),
  shelterId: shelter.shelterId,
  name: shelter.name,
  district: shelter.district,
  incidentId: shelter.incidentId,
  occupancy: shelter.occupancy,
  capacity: shelter.capacity,
  status: shelter.status,
  pendingRequests: shelter.pendingRequests,
  incomingResources: shelter.incomingResources,
});

const getShelters = async ({ incidentId } = {}) => {
  const filters = incidentId ? { incidentId } : {};
  return (await shelterRepository.findAll(filters)).map(toResponse);
};

const getShelterById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid shelter ID");
    error.status = 400;
    throw error;
  }
  const shelter = await shelterRepository.findById(id);
  if (!shelter) {
    const error = new Error("Shelter not found");
    error.status = 404;
    throw error;
  }
  return toResponse(shelter);
};

const getInventory = async ({ category, ownerId }) => {
  const filters = {};
  if (category) {
    if (!["Water", "Food", "Medicine"].includes(category)) {
      const error = new Error("Invalid inventory category");
      error.status = 400;
      throw error;
    }
    filters.category = category;
  }
  if (ownerId) {
    if (!mongoose.isValidObjectId(ownerId)) {
      const error = new Error("Invalid owner ID");
      error.status = 400;
      throw error;
    }
    filters.ownerId = ownerId;
  }
  return (await inventoryRepository.findAll(filters)).map(formatInventoryItem);
};

const formatInventoryItem = (item) => ({
  id: item._id.toString(),
  category: item.category,
  itemName: item.itemName,
  owner: {
    id: item.ownerId._id.toString(),
    name: item.ownerId.name,
    type: item.ownerId.type,
  },
  availableQuantity: item.availableQuantity,
  unit: item.unit,
  status: item.status,
});

const getInventoryItemById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid inventory item ID");
    error.status = 400;
    throw error;
  }
  const item = await inventoryRepository.findById(id);
  if (!item) {
    const error = new Error("Inventory item not found");
    error.status = 404;
    throw error;
  }
  return formatInventoryItem(item);
};

const getDeliveryResources = async ({ status }) => {
  const filters = {};
  if (status) {
    if (!["AVAILABLE", "IN_USE"].includes(status)) {
      const error = new Error("Invalid delivery resource status");
      error.status = 400;
      throw error;
    }
    filters.status = status;
  }
  return (await deliveryResourceRepository.findAll(filters)).map((resource) => ({
    id: resource._id.toString(),
    name: resource.name,
    type: resource.type,
    status: resource.status,
    currentLocation: resource.currentLocation,
  }));
};

const getDeliveryResourceById = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid delivery resource ID");
    error.status = 400;
    throw error;
  }
  const resource = await deliveryResourceRepository.findById(id);
  if (!resource) {
    const error = new Error("Delivery resource not found");
    error.status = 404;
    throw error;
  }
  return {
    id: resource._id.toString(),
    name: resource.name,
    type: resource.type,
    status: resource.status,
    currentLocation: resource.currentLocation,
  };
};

module.exports = { getShelters, getShelterById, getInventory, getInventoryItemById, getDeliveryResources, getDeliveryResourceById };
