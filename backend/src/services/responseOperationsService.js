const mongoose = require("mongoose");
const repository = require("../repositories/responseOperationsRepository");
const operationalRequestRepository = require("../repositories/operationalRequestRepository");

const createError = (message, status, code) => Object.assign(new Error(message), { status, code });

const formatWarning = (warning) => ({
  id: warning._id.toString(), warningId: warning.warningId, hazardType: warning.hazardType,
  severity: warning.severity || (warning.level === "Very High" ? "EMERGENCY" : warning.level === "High" ? "WARNING" : "WATCH"),
  targetArea: warning.targetArea || warning.areas?.join(", ") || null,
  district: warning.district,
  message: warning.message || warning.warning?.message || null,
  status: warning.status === "Published" ? "ACTIVE" : warning.status,
  issuedBy: warning.issuedBy || null, issuedAt: warning.issuedAt || warning.createdAt || null,
  updatedAt: warning.updatedAt || null, createdAt: warning.createdAt,
});

const formatIncident = (incident) => ({
  id: incident._id.toString(), incidentId: incident.incidentId,
  warning: incident.warningId ? formatWarning(incident.warningId) : null,
  hazardType: incident.hazardType, severity: incident.severity, district: incident.district,
  affectedArea: incident.affectedArea || null, affectedPopulation: incident.affectedPopulation ?? null,
  status: incident.status, createdAt: incident.createdAt,
});

const formatAgency = (agency) => ({
  id: agency._id.toString(), name: agency.name, type: agency.type,
  contact: agency.contact || null, status: agency.status || null,
});

const formatTeam = (team) => ({
  id: team._id.toString(), name: team.name,
  agency: team.agencyId ? formatAgency(team.agencyId) : null,
  type: team.type, currentLocation: team.currentLocation || null,
  capacity: team.capacity ?? null, status: "AVAILABLE",
});

const getWarning = async (warningId) => {
  const warning = await repository.findWarningByWarningId(warningId);
  if (!warning) throw createError("Warning not found", 404, "WARNING_NOT_FOUND");
  return formatWarning(warning);
};

const updateWarning = async (warningId, payload = {}) => {
  const warning = await repository.findWarningByWarningId(warningId);
  if (!warning) throw createError("Warning not found", 404, "WARNING_NOT_FOUND");

  const targetArea = typeof payload.targetArea === "string" ? payload.targetArea.trim() : "";
  const severity = typeof payload.severity === "string" ? payload.severity.trim().toUpperCase() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const issuedBy = typeof payload.issuedBy === "string" ? payload.issuedBy.trim() : "";

  if (!targetArea) throw createError("Target area is required", 400, "INVALID_TARGET_AREA");
  if (!["WATCH", "WARNING", "EMERGENCY"].includes(severity)) throw createError("Severity must be WATCH, WARNING, or EMERGENCY", 400, "INVALID_SEVERITY");
  if (!message) throw createError("Warning message is required", 400, "INVALID_WARNING_MESSAGE");
  if (payload.issue === true && !issuedBy) throw createError("Issuing officer is required", 400, "INVALID_ISSUING_OFFICER");

  const now = new Date();
  const update = { targetArea, severity, message, updatedAt: now };
  if (issuedBy) update.issuedBy = issuedBy;
  if (payload.issue === true) {
    update.status = "ACTIVE";
    update.issuedAt = now;
  }

  try {
    const updatedWarning = await repository.updateWarningByWarningId(warningId, update);
    if (!updatedWarning) throw createError("Warning not found", 404, "WARNING_NOT_FOUND");
    return formatWarning(updatedWarning);
  } catch (error) {
    if (error.code && error.status) throw error;
    throw createError("Unable to update warning", 500, "WARNING_UPDATE_FAILED");
  }
};

const getIncidents = async () => (await repository.findIncidents()).map(formatIncident);

const getIncident = async (incidentId) => {
  const incident = await repository.findIncidentByIncidentId(incidentId);
  if (!incident) throw createError("Incident not found", 404, "INCIDENT_NOT_FOUND");
  return formatIncident(incident);
};

const getAgencies = async ({ type, status }) => {
  const filters = {};
  if (type) filters.type = type;
  if (status) filters.status = status;
  return (await repository.findAgencies(filters)).map(formatAgency);
};

const getTeams = async ({ agencyId, status, type }) => {
  const filters = {};
  if (agencyId) {
    if (!mongoose.isValidObjectId(agencyId)) throw createError("Invalid agency ID", 400, "INVALID_AGENCY_ID");
    filters.agencyId = agencyId;
  }
  if (status && status !== "AVAILABLE") throw createError("Response teams remain AVAILABLE in the concurrent dispatch workflow", 400, "INVALID_TEAM_STATUS");
  if (status === "AVAILABLE") filters.status = status;
  if (type) filters.type = type;
  return (await repository.findTeams(filters)).map(formatTeam);
};

const markTeamAvailable = async (teamId) => {
  if (!mongoose.isValidObjectId(teamId)) throw createError("Response team not found", 404, "RESPONSE_TEAM_NOT_FOUND");
  const current = await repository.findTeamById(teamId);
  if (!current) throw createError("Response team not found", 404, "RESPONSE_TEAM_NOT_FOUND");
  if (current.status === "AVAILABLE") return formatTeam(current);
  const updated = await repository.releaseDeployedTeam(teamId);
  if (!updated) throw createError("Team availability changed before it could be released", 409, "TEAM_STATUS_CONFLICT");
  return formatTeam(await repository.findTeamById(teamId));
};

const getAssignments = async ({ incidentId }) => {
  const filters = {};
  if (incidentId) {
    const incident = await repository.findIncidentByIncidentId(incidentId);
    if (!incident) throw createError("Incident not found", 404, "INCIDENT_NOT_FOUND");
    filters.incidentId = incident._id;
  }
  const assignments = await repository.findAssignments(filters);
  if (incidentId) {
    const statusRank = { IN_PROGRESS: 0, DISPATCHED: 1, PLANNED: 2, COMPLETED: 3 };
    assignments.sort((left, right) => (statusRank[left.status] ?? 99) - (statusRank[right.status] ?? 99)
      || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }
  return assignments.map((assignment) => ({
    id: assignment._id.toString(), responseId: assignment.responseId,
    incident: assignment.incidentId ? {
      id: assignment.incidentId._id.toString(), incidentId: assignment.incidentId.incidentId,
      hazardType: assignment.incidentId.hazardType, severity: assignment.incidentId.severity,
      district: assignment.incidentId.district, status: assignment.incidentId.status,
    } : null,
    teams: assignment.teamIds.map(formatTeam), priority: assignment.priority || null,
    destination: assignment.destination || null, instructions: assignment.instructions || null,
    status: assignment.status, dispatchedAt: assignment.dispatchedAt || null,
    staffStatus: assignment.staffStatus || "PENDING", staffAcceptedAt: assignment.staffAcceptedAt || null,
    staffAcceptedBy: assignment.staffAcceptedBy || null,
    requiredCapabilities: assignment.requiredCapabilities || [],
    eta: assignment.eta || null, createdAt: assignment.createdAt,
  }));
};

const formatAssignment = (assignment) => ({
  id: assignment._id.toString(), responseId: assignment.responseId,
  incidentId: assignment.incidentId?.incidentId || null,
  status: assignment.status, priority: assignment.priority,
  staffStatus: assignment.staffStatus || "PENDING", staffAcceptedAt: assignment.staffAcceptedAt || null,
  staffAcceptedBy: assignment.staffAcceptedBy || null,
  destination: assignment.destination, instructions: assignment.instructions,
  teams: assignment.teamIds.map(formatTeam), dispatchedAt: assignment.dispatchedAt,
  requiredCapabilities: assignment.requiredCapabilities || [], eta: assignment.eta,
});

const dispatchResponseAssignment = async (payload = {}) => {
  const incidentId = typeof payload.incidentId === "string" ? payload.incidentId.trim() : "";
  const responseId = typeof payload.responseId === "string" ? payload.responseId.trim() : "";
  const priority = typeof payload.priority === "string" ? payload.priority.trim().toUpperCase() : "";
  const destination = typeof payload.destination === "string" ? payload.destination.trim() : "";
  const instructions = typeof payload.instructions === "string" ? payload.instructions.trim() : "";
  const eta = new Date(payload.eta);
  const teamIds = Array.isArray(payload.teamIds) ? payload.teamIds : [];
  const requiredCapabilities = Array.isArray(payload.requiredCapabilities) ? payload.requiredCapabilities : [];
  const allowedCapabilities = new Set(["RESCUE", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL", "SHELTER", "EVACUATION", "FOOD", "WATER", "MEDICINE"]);

  if (!incidentId) throw createError("Incident ID is required", 400, "INCIDENT_NOT_FOUND");
  if (!["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(priority)) throw createError("Priority must be LOW, MEDIUM, HIGH, or CRITICAL", 400, "INVALID_PRIORITY");
  if (!destination) throw createError("Destination is required", 400, "INVALID_DESTINATION");
  if (!instructions) throw createError("Dispatch instructions are required", 400, "INVALID_INSTRUCTIONS");
  if (!payload.eta || Number.isNaN(eta.getTime())) throw createError("A valid ETA is required", 400, "INVALID_ETA");
  if (teamIds.length === 0) throw createError("At least one response team is required", 400, "NO_TEAMS_SELECTED");
  if (teamIds.some((id) => !mongoose.isValidObjectId(id))) throw createError("One or more response team IDs are invalid", 400, "RESPONSE_TEAM_NOT_FOUND");
  if (new Set(teamIds.map(String)).size !== teamIds.length) throw createError("Duplicate response teams are not allowed", 400, "DUPLICATE_TEAM_SELECTION");
  if (requiredCapabilities.some((capability) => typeof capability !== "string" || !allowedCapabilities.has(capability))) throw createError("One or more response requirements are invalid", 400, "INVALID_RESPONSE_REQUIREMENT");
  if (new Set(requiredCapabilities).size !== requiredCapabilities.length) throw createError("Duplicate response requirements are not allowed", 400, "DUPLICATE_RESPONSE_REQUIREMENT");

  let assignmentId;
  try {
    assignmentId = await repository.runInTransaction(async (session) => {
      const incident = await repository.findIncidentForDispatch(incidentId, session);
      if (!incident) throw createError("Incident not found", 404, "INCIDENT_NOT_FOUND");

      let assignment = null;
      if (responseId) {
        assignment = await repository.findAssignmentForDispatch(responseId, session);
        if (!assignment) throw createError("Response assignment not found", 404, "RESPONSE_ASSIGNMENT_NOT_FOUND");
        if (assignment.incidentId.toString() !== incident._id.toString()) throw createError("Response assignment does not belong to this incident", 400, "RESPONSE_ASSIGNMENT_NOT_FOUND");
        if (!["PLANNED", "DISPATCHED", "IN_PROGRESS"].includes(assignment.status)) throw createError("Completed response assignments cannot be dispatched again", 409, "RESPONSE_ASSIGNMENT_NOT_DISPATCHABLE");
      } else {
        const existingAssignment = await repository.findExistingAssignmentForDispatch(incident._id, session);
        if (existingAssignment) throw createError("A response assignment already exists for this incident", 409, "RESPONSE_ASSIGNMENT_ALREADY_EXISTS");
      }

      const teams = await repository.findTeamsForDispatch(teamIds, session);
      if (teams.length !== teamIds.length) throw createError("One or more response teams were not found", 404, "RESPONSE_TEAM_NOT_FOUND");

      const now = new Date();
      const update = { teamIds, priority, destination, instructions, requiredCapabilities, eta, status: "DISPATCHED", staffStatus: "PENDING", staffAcceptedAt: null, staffAcceptedBy: null, dispatchedAt: now };
      let savedAssignment;
      if (assignment) {
        savedAssignment = await repository.updatePlannedAssignment(assignment._id, update, session);
        if (!savedAssignment) throw createError("Response assignment is no longer dispatchable", 409, "RESPONSE_ASSIGNMENT_NOT_DISPATCHABLE");
      } else {
        const generatedResponseId = `RSP-${incidentId}-${new mongoose.Types.ObjectId().toString().slice(-8).toUpperCase()}`;
        savedAssignment = await repository.createAssignment({ responseId: generatedResponseId, incidentId: incident._id, ...update, createdAt: now }, session);
      }
      const updatedIncident = await repository.updateIncidentResponseStatus(incident._id, session);
      if (!updatedIncident) throw createError("Incident cannot enter response-in-progress state", 409, "DISPATCH_TRANSACTION_FAILED");
      return savedAssignment._id;
    });
  } catch (error) {
    if (error.code && error.status) throw error;
    if (isTransactionUnavailable(error)) throw createError("Atomic response dispatch requires MongoDB transaction support.", 503, "TRANSACTION_UNAVAILABLE");
    throw createError("Response assignment could not be dispatched atomically.", 500, "DISPATCH_TRANSACTION_FAILED");
  }

  const dispatched = await repository.findAssignmentWithDetailsById(assignmentId);
  if (!dispatched) throw createError("Dispatched assignment could not be loaded", 500, "DISPATCH_TRANSACTION_FAILED");
  return formatAssignment(dispatched);
};

const acceptResponseAssignmentByStaff = async (responseId, actor = {}) => {
  if (!responseId || typeof responseId !== "string") throw createError("Response assignment not found", 404, "RESPONSE_ASSIGNMENT_NOT_FOUND");
  try {
    await repository.runInTransaction(async (session) => {
      const current = await repository.findAssignmentForDispatch(responseId, session);
      if (!current) throw createError("Response assignment not found", 404, "RESPONSE_ASSIGNMENT_NOT_FOUND");
      if (current.staffStatus === "DISPATCHED") throw createError("Response assignment has already been accepted", 409, "RESPONSE_ASSIGNMENT_ALREADY_ACCEPTED");
      if (!["DISPATCHED", "IN_PROGRESS"].includes(current.status)) throw createError("Only an active dispatched response can be accepted", 409, "RESPONSE_ASSIGNMENT_NOT_ACCEPTABLE");
      const accepted = await repository.acceptAssignmentByStaff(responseId, new Date(), actor.name || actor.id || "Staff Officer", session);
      if (!accepted) throw createError("Response assignment status changed before acceptance", 409, "RESPONSE_ASSIGNMENT_ACCEPT_CONFLICT");
    });
    const accepted = await repository.findAssignments({ responseId });
    if (!accepted[0]) throw createError("Accepted response assignment could not be loaded", 404, "RESPONSE_ASSIGNMENT_NOT_FOUND");
    return formatAssignment(accepted[0]);
  } catch (error) {
    if (error.code && error.status) throw error;
    if (isTransactionUnavailable(error)) throw createError("Atomic staff acceptance requires MongoDB transaction support.", 503, "TRANSACTION_UNAVAILABLE");
    throw createError("Response assignment acceptance failed.", 500, "RESPONSE_ASSIGNMENT_ACCEPT_FAILED");
  }
};

const isTransactionUnavailable = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("transaction numbers are only allowed on a replica set member or mongos")
    || message.includes("transactions are not supported")
    || message.includes("replica set");
};

const resolveResponse = async (incidentId) => {
  if (!incidentId || typeof incidentId !== "string") throw createError("Incident not found", 404, "INCIDENT_NOT_FOUND");
  try {
    return await repository.runInTransaction(async (session) => {
      const incident = await repository.findIncidentForDispatch(incidentId, session);
      if (!incident) throw createError("Incident not found", 404, "INCIDENT_NOT_FOUND");
      if (incident.status === "RESOLVED") throw createError("Incident has already been resolved", 409, "INCIDENT_ALREADY_RESOLVED");

      const assignment = await repository.findCurrentAssignmentByIncident(incident._id, session)
        || await repository.findAnyAssignmentByIncident(incident._id, session);
      if (!assignment) throw createError("Response assignment not found", 404, "RESPONSE_ASSIGNMENT_NOT_FOUND");
      if (!["DISPATCHED", "IN_PROGRESS"].includes(assignment.status)) {
        throw createError("Response assignment is not in a resolvable state", 409, "RESPONSE_NOT_RESOLVABLE");
      }

      const outstanding = await repository.countOutstandingDistributions(incident._id, session);
      if (outstanding > 0) throw createError("Incident cannot be resolved while resource distributions are still en route", 409, "OUTSTANDING_DISTRIBUTIONS");
      const outstandingRequests = await repository.countOutstandingOperationalRequests(incident._id, session);
      if (outstandingRequests > 0) throw createError("Incident cannot be resolved while operational requests are pending approval or dispatch", 409, "OUTSTANDING_OPERATIONAL_REQUESTS");

      const teamIds = assignment.teamIds || [];
      const teams = await repository.findTeamsForResolution(teamIds, session);
      if (teams.length !== teamIds.length) throw createError("One or more assigned teams no longer exist", 409, "TEAM_STATE_CONFLICT");

      const completedAssignment = await repository.completeAssignment(assignment._id, session);
      if (!completedAssignment) throw createError("Response assignment is no longer resolvable", 409, "RESPONSE_NOT_RESOLVABLE");
      await operationalRequestRepository.completeDispatchedForIncident(incident._id, new Date(), session);
      const resolvedIncident = await repository.resolveIncident(incident._id, session);
      if (!resolvedIncident) throw createError("Incident is no longer resolvable", 409, "INCIDENT_ALREADY_RESOLVED");

      return {
        incidentId: resolvedIncident.incidentId,
        incidentStatus: resolvedIncident.status,
        responseId: completedAssignment.responseId,
        responseStatus: completedAssignment.status,
        releasedTeams: 0,
      };
    });
  } catch (error) {
    const domainCodes = ["INCIDENT_NOT_FOUND", "INCIDENT_ALREADY_RESOLVED", "RESPONSE_ASSIGNMENT_NOT_FOUND", "RESPONSE_NOT_RESOLVABLE", "OUTSTANDING_DISTRIBUTIONS", "OUTSTANDING_OPERATIONAL_REQUESTS", "TEAM_STATE_CONFLICT"];
    if (error.code && domainCodes.includes(error.code)) throw error;
    if (isTransactionUnavailable(error)) throw createError("Atomic response resolution requires MongoDB transaction support.", 503, "TRANSACTION_UNAVAILABLE");
    throw createError("Response resolution could not be committed atomically.", 500, "RESPONSE_RESOLUTION_FAILED");
  }
};

module.exports = { getWarning, updateWarning, getIncidents, getIncident, getAgencies, getTeams, markTeamAvailable, getAssignments, dispatchResponseAssignment, acceptResponseAssignmentByStaff, resolveResponse };
