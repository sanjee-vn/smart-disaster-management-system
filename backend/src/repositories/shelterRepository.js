const Shelter = require("../models/Shelter");

const findAll = (filters = {}) => Shelter.find(filters).sort({ name: 1 }).lean();
const findById = (id) => Shelter.findById(id).lean();
const findByIdInSession = (id, session) => Shelter.findById(id).session(session);
const addIncomingResource = (id, resource, session) => Shelter.findByIdAndUpdate(
  id,
  { $push: { incomingResources: resource } },
  { returnDocument: "after", session }
);
const markIncomingResourceDelivered = async (id, distributionId, session) => {
  const result = await Shelter.updateOne(
    { _id: id, incomingResources: { $elemMatch: { distributionId } } },
    { $set: { "incomingResources.$[resource].status": "Delivered" } },
    { arrayFilters: [{ "resource.distributionId": distributionId }], session }
  );
  return result.matchedCount > 0;
};

module.exports = { findAll, findById, findByIdInSession, addIncomingResource, markIncomingResourceDelivered };
