const crypto = require("crypto");
const mongoose = require("mongoose");
const repository = require("../repositories/operationalRequestRepository");
const responseRepository = require("../repositories/responseOperationsRepository");

const fail = (code, message, status) => { const error = new Error(message); error.code = code; error.status = status; return error; };
const capabilities = new Set(["RESCUE", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL"]);
const priorities = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
const transactionUnavailable = error => /transaction|replica set/i.test(String(error?.message || ""));
const teamMatchesCapability = (team, capability) => {
  const text = `${team.name || ""} ${team.type || ""}`.toUpperCase();
  if (capability === "RESCUE") return text.includes("RESCUE");
  if (capability === "MEDICAL") return text.includes("MEDICAL");
  if (capability === "POLICE") return text.includes("POLICE");
  if (capability === "ARMED_FORCES") return text.includes("ARMY") || text.includes("ARMED");
  if (capability === "FIRE_RESCUE") return text.includes("FIRE");
  return false;
};
const format = request => ({
  id: request._id.toString(), requestId: request.requestId,
  incident: request.incidentId?.incidentId ? { id: request.incidentId._id.toString(), incidentId: request.incidentId.incidentId, hazardType: request.incidentId.hazardType, severity: request.incidentId.severity, district: request.incidentId.district, status: request.incidentId.status } : null,
  capability: request.capability, requestedPersonnelCount: request.requestedPersonnelCount,
  requestedLocation: request.requestedLocation, requiredAt: request.requiredAt, priority: request.priority,
  notes: request.notes || "", status: request.status, reviewedBy: request.reviewedBy || null,
  reviewedAt: request.reviewedAt || null, rejectionReason: request.rejectionReason || null,
  approvedTeam: request.approvedTeamId?.name ? { id: request.approvedTeamId._id.toString(), name: request.approvedTeamId.name, type: request.approvedTeamId.type, capacity: request.approvedTeamId.capacity, status: request.approvedTeamId.status, agency: request.approvedTeamId.agencyId ? { id: request.approvedTeamId.agencyId._id.toString(), name: request.approvedTeamId.agencyId.name, type: request.approvedTeamId.agencyId.type } : null } : null,
  dispatchedAt: request.dispatchedAt || null, createdAt: request.createdAt,
});
const list = async ({ incidentId, status } = {}) => {
  const filters = {};
  if (incidentId) { const incident = await responseRepository.findIncidentByIncidentId(incidentId); if (!incident) throw fail("INCIDENT_NOT_FOUND", "Incident not found", 404); filters.incidentId = incident._id; }
  if (status) { if (!["PENDING", "APPROVED", "REJECTED", "DISPATCHED"].includes(status)) throw fail("INVALID_REQUEST_STATUS", "Invalid operational request status", 400); filters.status = status; }
  return (await repository.findAll(filters)).map(format);
};
const create = async (payload = {}) => {
  const incidentId = typeof payload.incidentId === "string" ? payload.incidentId.trim() : "";
  const capability = String(payload.capability || "").toUpperCase(); const priority = String(payload.priority || "").toUpperCase();
  const requestedLocation = typeof payload.requestedLocation === "string" ? payload.requestedLocation.trim() : "";
  const notes = typeof payload.notes === "string" ? payload.notes.trim() : ""; const requiredAt = new Date(payload.requiredAt);
  const personnel = Number(payload.requestedPersonnelCount);
  const incident = await responseRepository.findIncidentByIncidentId(incidentId);
  if (!incident) throw fail("INCIDENT_NOT_FOUND", "Incident not found", 404);
  if (!capabilities.has(capability)) throw fail("INVALID_CAPABILITY", "Select a valid operational capability", 400);
  if (!Number.isInteger(personnel) || personnel < 1) throw fail("INVALID_PERSONNEL_COUNT", "Personnel count must be a positive whole number", 400);
  if (!requestedLocation) throw fail("INVALID_REQUEST_LOCATION", "Requested location is required", 400);
  if (!payload.requiredAt || Number.isNaN(requiredAt.getTime())) throw fail("INVALID_REQUIRED_AT", "A valid required date and time is required", 400);
  if (!priorities.has(priority)) throw fail("INVALID_PRIORITY", "Select a valid priority", 400);
  const requestId = `REQ-${new Date().getUTCFullYear()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  await repository.create({ requestId, incidentId: incident._id, capability, requestedPersonnelCount: personnel, requestedLocation, requiredAt, priority, notes, status: "PENDING" });
  return format(await repository.findByRequestId(requestId));
};
const review = async (requestId, payload = {}) => {
  const decision = String(payload.decision || "").toUpperCase(); const reviewer = String(payload.reviewedBy || "District Resource Officer").trim();
  try {
    await repository.runInTransaction(async session => {
      const request = await repository.findForUpdate(requestId, session); if (!request) throw fail("REQUEST_NOT_FOUND", "Operational request not found", 404);
      if (request.status !== "PENDING") throw fail("REQUEST_NOT_PENDING", "Only pending requests can be reviewed", 409);
      if (decision === "REJECT") { const reason = String(payload.rejectionReason || "").trim(); if (!reason) throw fail("REJECTION_REASON_REQUIRED", "A rejection reason is required", 400); await repository.rejectPending(request._id, reviewer, reason, new Date(), session); return; }
      if (decision !== "APPROVE" || !mongoose.isValidObjectId(payload.teamId)) throw fail("INVALID_REVIEW", "Approval requires a valid response team", 400);
      const team = await repository.findTeam(payload.teamId, session); if (!team) throw fail("RESPONSE_TEAM_NOT_FOUND", "Response team not found", 404);
      if (team.status !== "AVAILABLE") throw fail("TEAM_UNAVAILABLE", "Selected team is not available", 409);
      if (!teamMatchesCapability(team, request.capability)) throw fail("TEAM_CAPABILITY_MISMATCH", "Selected team does not match the requested capability", 409);
      if (Number(team.capacity || 0) < request.requestedPersonnelCount) throw fail("TEAM_CAPACITY_INSUFFICIENT", "Selected team does not have enough personnel capacity", 409);
      await repository.approvePending(request._id, team._id, reviewer, new Date(), session);
    });
  } catch (error) { if (error.code && error.status) throw error; if (transactionUnavailable(error)) throw fail("TRANSACTION_UNAVAILABLE", "Atomic request review requires MongoDB transaction support", 503); throw fail("REQUEST_REVIEW_FAILED", "Operational request review failed", 500); }
  return format(await repository.findByRequestId(requestId));
};
const dispatch = async requestId => {
  try {
    await repository.runInTransaction(async session => {
      const request = await repository.findForUpdate(requestId, session); if (!request) throw fail("REQUEST_NOT_FOUND", "Operational request not found", 404);
      if (request.status !== "APPROVED" || !request.approvedTeamId) throw fail("REQUEST_NOT_APPROVED", "Only approved requests can be dispatched", 409);
      const team = await repository.findTeam(request.approvedTeamId, session);
      if (!team || team.status !== "AVAILABLE") throw fail("TEAM_UNAVAILABLE", "Approved team is no longer available", 409);
      if (!teamMatchesCapability(team, request.capability)) throw fail("TEAM_CAPABILITY_MISMATCH", "Approved team no longer matches the requested capability", 409);
      if (Number(team.capacity || 0) < request.requestedPersonnelCount) throw fail("TEAM_CAPACITY_INSUFFICIENT", "Approved team no longer has enough personnel capacity", 409);
      const deployed = await repository.deployTeam(team._id, session); if (!deployed) throw fail("TEAM_UNAVAILABLE", "Approved team is no longer available", 409);
      const now = new Date(); let assignment = await repository.findAssignment(request.incidentId, session);
      const update = { priority: request.priority, destination: request.requestedLocation, instructions: request.notes || `Fulfil ${request.capability} operational request`, eta: request.requiredAt, status: "DISPATCHED", dispatchedAt: now };
      if (assignment) assignment = await repository.updateAssignmentForDispatch(assignment._id, update, team._id, request.capability, session);
      else assignment = await repository.createAssignment({ responseId: `RSP-${request.requestId}`, incidentId: request.incidentId, teamIds: [team._id], requiredCapabilities: [request.capability], createdAt: now, ...update }, session);
      if (!assignment || !await repository.progressIncident(request.incidentId, session) || !await repository.markDispatched(request._id, now, session)) throw fail("REQUEST_DISPATCH_CONFLICT", "Operational request changed during dispatch", 409);
    });
  } catch (error) { if (error.code && error.status) throw error; if (transactionUnavailable(error)) throw fail("TRANSACTION_UNAVAILABLE", "Atomic request dispatch requires MongoDB transaction support", 503); throw fail("REQUEST_DISPATCH_FAILED", "Operational request dispatch failed", 500); }
  return format(await repository.findByRequestId(requestId));
};
module.exports = { list, create, review, dispatch };
