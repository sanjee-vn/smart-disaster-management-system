const Shelter = require("../models/Shelter");

const findAll = (filters = {}) => Shelter.find(filters).sort({ name: 1 }).lean();
const findById = (id) => Shelter.findById(id).lean();
const findByIdInSession = (id, session) => Shelter.findById(id).session(session);
const addIncomingResource = (id, resource, session) => Shelter.findByIdAndUpdate(
  id,
  { $push: { incomingResources: resource } },
  { returnDocument: "after", session }
);

module.exports = { findAll, findById, findByIdInSession, addIncomingResource };
