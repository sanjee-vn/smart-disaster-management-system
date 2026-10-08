const Warning = require("../models/Warning");
const Incident = require("../models/Incident");
const Agency = require("../models/Agency");
const ResponseTeam = require("../models/ResponseTeam");
const ResponseAssignment = require("../models/ResponseAssignment");
const Distribution = require("../models/Distribution");

const findWarningByWarningId = (warningId) => Warning.findOne({ warningId }).lean();
const updateWarningByWarningId = (warningId, update) => Warning.findOneAndUpdate(
  { warningId },
  { $set: update },
  { returnDocument: "after", runValidators: true }
).lean();
const findIncidents = () => Incident.find().populate({ path: "warningId", model: Warning }).sort({ createdAt: -1 }).lean();
const findIncidentByIncidentId = (incidentId) => Incident.findOne({ incidentId }).populate({ path: "warningId", model: Warning }).lean();
const findAgencies = (filters) => Agency.find(filters).sort({ name: 1 }).lean();
const findTeams = (filters) => ResponseTeam.find(filters).populate({ path: "agencyId", model: Agency, select: "name type contact status" }).sort({ name: 1 }).lean();
const findAssignments = (filters) => ResponseAssignment.find(filters)
  .populate({ path: "incidentId", model: Incident, select: "incidentId hazardType severity district status" })
  .populate({ path: "teamIds", model: ResponseTeam, populate: { path: "agencyId", model: Agency, select: "name type" } })
  .sort({ createdAt: -1 })
  .lean();

const runInTransaction = async (operation) => {
  const session = await ResponseAssignment.startSession();
  try {
    let result;
    await session.withTransaction(async () => { result = await operation(session); });
    return result;
  } finally {
    await session.endSession();
  }
};

const findIncidentForDispatch = (incidentId, session) => Incident.findOne({ incidentId }).session(session).lean();
const findAssignmentForDispatch = (responseId, session) => ResponseAssignment.findOne({ responseId }).session(session).lean();
const findExistingAssignmentForDispatch = (incidentId, session) => ResponseAssignment.findOne({ incidentId }).sort({ createdAt: -1 }).session(session).lean();
const findTeamsForDispatch = (teamIds, session) => ResponseTeam.find({ _id: { $in: teamIds } }).session(session).lean();
const deployAvailableTeams = (teamIds, session) => ResponseTeam.updateMany(
  { _id: { $in: teamIds }, status: "AVAILABLE" },
  { $set: { status: "DEPLOYED" } },
  { session }
);
const updatePlannedAssignment = (assignmentId, update, session) => ResponseAssignment.findOneAndUpdate(
  { _id: assignmentId, status: "PLANNED" },
  { $set: update },
  { returnDocument: "after", runValidators: true, session }
).lean();
const createAssignment = (assignment, session) => ResponseAssignment.create([assignment], { session }).then(([created]) => created.toObject());
const updateIncidentResponseStatus = (incidentId, session) => Incident.findOneAndUpdate(
  { _id: incidentId, status: { $in: ["ACTIVE", "RESPONSE_IN_PROGRESS"] } },
  { $set: { status: "RESPONSE_IN_PROGRESS" } },
  { returnDocument: "after", runValidators: true, session }
).lean();
const findAssignmentWithDetailsById = (assignmentId) => ResponseAssignment.findById(assignmentId)
  .populate({ path: "incidentId", model: Incident, select: "incidentId hazardType severity district status" })
  .populate({ path: "teamIds", model: ResponseTeam, populate: { path: "agencyId", model: Agency, select: "name type" } })
  .lean();
const findCurrentAssignmentByIncident = (incidentId, session) => ResponseAssignment.findOne({ incidentId, status: { $in: ["DISPATCHED", "IN_PROGRESS"] } }).sort({ createdAt: -1 }).session(session).lean();
const findAnyAssignmentByIncident = (incidentId, session) => ResponseAssignment.findOne({ incidentId }).sort({ createdAt: -1 }).session(session).lean();
const findTeamsForResolution = (teamIds, session) => ResponseTeam.find({ _id: { $in: teamIds } }).session(session).lean();
const releaseDeployedTeams = (teamIds, session) => ResponseTeam.updateMany(
  { _id: { $in: teamIds }, status: "DEPLOYED" },
  { $set: { status: "AVAILABLE" } },
  { session }
);
const completeAssignment = (assignmentId, session) => ResponseAssignment.findOneAndUpdate(
  { _id: assignmentId, status: { $in: ["DISPATCHED", "IN_PROGRESS"] } },
  { $set: { status: "COMPLETED" } },
  { returnDocument: "after", runValidators: true, session }
).lean();
const resolveIncident = (incidentId, session) => Incident.findOneAndUpdate(
  { _id: incidentId, status: { $ne: "RESOLVED" } },
  { $set: { status: "RESOLVED" } },
  { returnDocument: "after", runValidators: true, session }
).lean();
const countOutstandingDistributions = (incidentId, session) => Distribution.countDocuments({ incidentId, status: "EN_ROUTE" }).session(session);

module.exports = {
  findWarningByWarningId, updateWarningByWarningId, findIncidents, findIncidentByIncidentId,
  findAgencies, findTeams, findAssignments, runInTransaction, findIncidentForDispatch,
  findAssignmentForDispatch, findExistingAssignmentForDispatch, findTeamsForDispatch, deployAvailableTeams,
  updatePlannedAssignment, createAssignment, updateIncidentResponseStatus,
  findAssignmentWithDetailsById,
  findCurrentAssignmentByIncident, findAnyAssignmentByIncident, findTeamsForResolution, releaseDeployedTeams,
  completeAssignment, resolveIncident, countOutstandingDistributions,
};
