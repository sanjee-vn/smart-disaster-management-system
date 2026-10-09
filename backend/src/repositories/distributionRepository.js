const Distribution = require("../models/Distribution");

const findByRequestId = (requestId) => Distribution.findOne({ requestId })
  .populate({ path: "incidentId", select: "incidentId hazardType district" })
  .populate({ path: "responseAssignmentId", select: "responseId" })
  .populate({ path: "shelterId", select: "shelterId name district" })
  .populate({ path: "inventoryItemId", select: "category itemName unit" })
  .populate({ path: "resourceOwnerId", select: "name type" })
  .populate({ path: "deliveryResourceId", select: "name type" })
  .lean();
const create = async (data, session) => (await Distribution.create([data], { session }))[0];
const findForCompletion = (distributionId, incidentId, session) => Distribution.findOne({ distributionId, incidentId }).session(session);
const acceptForDelivery = (id, acceptedAt, acceptedBy, session) => Distribution.findOneAndUpdate(
  { _id: id, status: "PENDING" },
  { $set: { status: "EN_ROUTE", acceptedAt, acceptedBy } },
  { returnDocument: "after", session }
);
const markDelivered = (id, deliveredAt, session) => Distribution.findOneAndUpdate(
  { _id: id, status: "EN_ROUTE" },
  { $set: { status: "DELIVERED", deliveredAt } },
  { returnDocument: "after", session }
);
const findByDistributionId = (distributionId) => Distribution.findOne({ distributionId })
  .populate({ path: "incidentId", select: "incidentId hazardType district" })
  .populate({ path: "responseAssignmentId", select: "responseId" })
  .populate({ path: "shelterId", select: "shelterId name district" })
  .populate({ path: "inventoryItemId", select: "category itemName unit" })
  .populate({ path: "resourceOwnerId", select: "name type" })
  .populate({ path: "deliveryResourceId", select: "name type" })
  .lean();
const findByIncidentId = (incidentId) => Distribution.find({ incidentId })
  .populate({ path: "incidentId", select: "incidentId hazardType district" })
  .populate({ path: "responseAssignmentId", select: "responseId" })
  .populate({ path: "shelterId", select: "shelterId name district" })
  .populate({ path: "inventoryItemId", select: "category itemName unit" })
  .populate({ path: "resourceOwnerId", select: "name type" })
  .populate({ path: "deliveryResourceId", select: "name type" })
  .sort({ createdAt: -1 })
  .lean();

module.exports = { findByRequestId, create, findForCompletion, acceptForDelivery, markDelivered, findByDistributionId, findByIncidentId };
