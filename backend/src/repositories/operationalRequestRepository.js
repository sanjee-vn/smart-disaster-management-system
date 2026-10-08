const mongoose = require("mongoose");
const OperationalRequest = require("../models/OperationalRequest");
const ResponseAssignment = require("../models/ResponseAssignment");
const ResponseTeam = require("../models/ResponseTeam");
const Incident = require("../models/Incident");

const populate = (query) => query
  .populate({ path: "incidentId", select: "incidentId hazardType severity district status" })
  .populate({ path: "approvedTeamId", select: "name type capacity status currentLocation", populate: { path: "agencyId", select: "name type" } });
const findAll = (filters = {}) => populate(OperationalRequest.find(filters).sort({ createdAt: -1 })).lean();
const findByRequestId = (requestId) => populate(OperationalRequest.findOne({ requestId })).lean();
const create = (data) => OperationalRequest.create(data);
const runInTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try { let result; await session.withTransaction(async () => { result = await operation(session); }); return result; }
  finally { await session.endSession(); }
};
const findForUpdate = (requestId, session) => OperationalRequest.findOne({ requestId }).session(session);
const findTeam = (teamId, session) => ResponseTeam.findById(teamId).session(session);
const approvePending = (id, teamId, reviewer, reviewedAt, session) => OperationalRequest.findOneAndUpdate(
  { _id: id, status: "PENDING" }, { $set: { status: "APPROVED", approvedTeamId: teamId, reviewedBy: reviewer, reviewedAt, rejectionReason: null } },
  { new: true, runValidators: true, session }
);
const rejectPending = (id, reviewer, reason, reviewedAt, session) => OperationalRequest.findOneAndUpdate(
  { _id: id, status: "PENDING" }, { $set: { status: "REJECTED", reviewedBy: reviewer, reviewedAt, rejectionReason: reason, approvedTeamId: null } },
  { new: true, runValidators: true, session }
);
const deployTeam = (teamId, session) => ResponseTeam.findOneAndUpdate(
  { _id: teamId, status: "AVAILABLE" }, { $set: { status: "DEPLOYED" } }, { new: true, session }
);
const findAssignment = (incidentId, session) => ResponseAssignment.findOne({ incidentId, status: { $in: ["PLANNED", "DISPATCHED", "IN_PROGRESS"] } }).sort({ createdAt: -1 }).session(session);
const createAssignment = async (data, session) => (await ResponseAssignment.create([data], { session }))[0];
const updateAssignmentForDispatch = (id, data, teamId, capability, session) => ResponseAssignment.findOneAndUpdate(
  { _id: id, status: { $in: ["PLANNED", "DISPATCHED", "IN_PROGRESS"] } },
  { $set: data, $addToSet: { teamIds: teamId, requiredCapabilities: capability } },
  { new: true, runValidators: true, session }
);
const progressIncident = (id, session) => Incident.findOneAndUpdate(
  { _id: id, status: { $in: ["ACTIVE", "RESPONSE_IN_PROGRESS"] } }, { $set: { status: "RESPONSE_IN_PROGRESS" } }, { new: true, session }
);
const markDispatched = (id, dispatchedAt, session) => OperationalRequest.findOneAndUpdate(
  { _id: id, status: "APPROVED" }, { $set: { status: "DISPATCHED", dispatchedAt } }, { new: true, session }
);
const countOutstanding = (incidentId, session) => OperationalRequest.countDocuments({ incidentId, status: { $in: ["PENDING", "APPROVED"] } }).session(session);

module.exports = { findAll, findByRequestId, create, runInTransaction, findForUpdate, findTeam, approvePending, rejectPending, deployTeam, findAssignment, createAssignment, updateAssignmentForDispatch, progressIncident, markDispatched, countOutstanding };
