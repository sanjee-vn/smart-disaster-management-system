const ResourceOwner = require("../models/ResourceOwner");
const InventoryItem = require("../models/InventoryItem");

const findAll = (filters) => InventoryItem.find(filters)
  .populate({ path: "ownerId", select: "name type", model: ResourceOwner })
  .sort({ category: 1, itemName: 1 })
  .lean();

const findById = (id) => InventoryItem.findById(id)
  .populate({ path: "ownerId", select: "name type", model: ResourceOwner })
  .lean();

const findByIdInSession = (id, session) => InventoryItem.findById(id).session(session);
const decrementAvailableStock = (id, quantity, session) => InventoryItem.findOneAndUpdate(
  { _id: id, status: "ACTIVE", availableQuantity: { $gte: quantity } },
  { $inc: { availableQuantity: -quantity } },
  { returnDocument: "after", session }
);

module.exports = { findAll, findById, findByIdInSession, decrementAvailableStock };
