const DeliveryResource = require("../models/DeliveryResource");

const findAll = (filters) => DeliveryResource.find(filters).sort({ status: 1, name: 1 }).lean();
const findById = (id) => DeliveryResource.findById(id).lean();

module.exports = { findAll, findById };
