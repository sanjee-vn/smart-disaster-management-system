const ResourceOwner = require("../models/ResourceOwner");
const InventoryItem = require("../models/InventoryItem");

const findAll = (filters) => InventoryItem.find(filters)
  .populate({ path: "ownerId", select: "name type", model: ResourceOwner })
  .sort({ category: 1, itemName: 1 })
  .lean();

const findById = (id) => InventoryItem.findById(id)
  .populate({ path: "ownerId", select: "name type", model: ResourceOwner })
  .lean();

module.exports = { findAll, findById };
