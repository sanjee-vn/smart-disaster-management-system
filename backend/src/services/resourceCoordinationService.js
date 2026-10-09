const mongoose = require("mongoose");
const shelterRepository = require("../repositories/shelterRepository");
const inventoryRepository = require("../repositories/inventoryRepository");
const deliveryResourceRepository = require("../repositories/deliveryResourceRepository");
const Incident = require("../models/Incident");

const toResponse = (shelter) => ({
  id: shelter._id.toString(),
  shelterId: shelter.shelterId,
  name: shelter.name,
  district: shelter.district,
  address: shelter.address || "",
  latitude: shelter.latitude ?? null,
  longitude: shelter.longitude ?? null,
  contactPerson: shelter.contactPerson || "",
  contactNumber: shelter.contactNumber || "",
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

const createShelter = async (payload = {}) => {
  const incidentId = typeof payload.incidentId === "string" ? payload.incidentId.trim() : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const district = typeof payload.district === "string" ? payload.district.trim() : "";
  const address = typeof payload.address === "string" ? payload.address.trim() : "";
  const contactPerson = typeof payload.contactPerson === "string" ? payload.contactPerson.trim() : "";
  const contactNumber = typeof payload.contactNumber === "string" ? payload.contactNumber.trim() : "";
  const occupancy = Number(payload.occupancy);
  const capacity = Number(payload.capacity);
  const status = payload.status || "Operational";
  const latitude = payload.latitude === "" || payload.latitude == null ? null : Number(payload.latitude);
  const longitude = payload.longitude === "" || payload.longitude == null ? null : Number(payload.longitude);
  if (!incidentId || !name || !district || !address) { const error = new Error("Incident, shelter name, district, and address are required"); error.status = 400; throw error; }
  if (!Number.isInteger(capacity) || capacity < 1) { const error = new Error("Capacity must be a whole number greater than zero"); error.status = 400; throw error; }
  if (!Number.isInteger(occupancy) || occupancy < 0 || occupancy > capacity) { const error = new Error("Occupancy must be between zero and capacity"); error.status = 400; throw error; }
  if (!["Operational", "Near Capacity", "At Capacity", "Inactive"].includes(status)) { const error = new Error("Invalid shelter status"); error.status = 400; throw error; }
  if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) { const error = new Error("Latitude must be between -90 and 90"); error.status = 400; throw error; }
  if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) { const error = new Error("Longitude must be between -180 and 180"); error.status = 400; throw error; }
  if (!await Incident.exists({ incidentId })) { const error = new Error("Incident not found"); error.status = 404; throw error; }
  const shelterId = `SHT-${incidentId.replace(/^INC-/, "").replace(/[^A-Z0-9]/gi, "-")}-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;
  const created = await shelterRepository.create({ shelterId, incidentId, name, district, address, latitude, longitude, contactPerson, contactNumber, occupancy, capacity, status, pendingRequests: [], incomingResources: [] });
  return toResponse(created);
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

const getInventory = async ({ category, ownerId, availableOnly }) => {
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
  if (availableOnly === "true") {
    filters.status = "ACTIVE";
    filters.availableQuantity = { $gt: 0 };
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

module.exports = { getShelters, createShelter, getShelterById, getInventory, getInventoryItemById, getDeliveryResources, getDeliveryResourceById };
