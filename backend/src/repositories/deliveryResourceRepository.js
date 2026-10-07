const DeliveryResource = require("../models/DeliveryResource");

const findAll = (filters) => DeliveryResource.find(filters).sort({ status: 1, name: 1 }).lean();
const findById = (id) => DeliveryResource.findById(id).lean();
const findByIdInSession = (id, session) => DeliveryResource.findById(id).session(session);
const reserveAvailable = (id, session) => DeliveryResource.findOneAndUpdate(
  { _id: id, status: "AVAILABLE" },
  { $set: { status: "IN_USE" } },
  { returnDocument: "after", session }
);

module.exports = { findAll, findById, findByIdInSession, reserveAvailable };
