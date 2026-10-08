const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const repository = require("../src/repositories/operationalRequestRepository");
const responseRepository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/operationalRequestService");

const ids = { incident: new mongoose.Types.ObjectId(), request: new mongoose.Types.ObjectId(), team: new mongoose.Types.ObjectId(), assignment: new mongoose.Types.ObjectId() };
const methods = ["findAll", "findByRequestId", "create", "runInTransaction", "findForUpdate", "findTeam", "approvePending", "rejectPending", "deployTeam", "findAssignment", "createAssignment", "updateAssignmentForDispatch", "progressIncident", "markDispatched"];
const originals = Object.fromEntries(methods.map(name => [name, repository[name]]));
const originalIncident = responseRepository.findIncidentByIncidentId;
let state;
const reset = () => {
  state = { incident: { _id: ids.incident, incidentId: "INC-001", hazardType: "Flood", severity: "EMERGENCY", district: "Colombo", status: "ACTIVE" }, request: null, team: { _id: ids.team, name: "Rescue Team 02", type: "Flood Rescue", capacity: 10, status: "AVAILABLE" }, assignment: null };
  responseRepository.findIncidentByIncidentId = async id => id === "INC-001" ? state.incident : null;
  repository.runInTransaction = async operation => { const snapshot = structuredClone(state); try { return await operation({}); } catch (error) { state = snapshot; throw error; } };
  repository.create = async data => { state.request = { _id: ids.request, createdAt: new Date(), ...data }; return state.request; };
  repository.findByRequestId = async id => state.request?.requestId === id ? { ...state.request, incidentId: state.incident, approvedTeamId: state.request.approvedTeamId ? state.team : null } : null;
  repository.findForUpdate = async id => state.request?.requestId === id ? state.request : null;
  repository.findTeam = async id => String(id) === String(ids.team) ? state.team : null;
  repository.approvePending = async (_id, teamId, reviewedBy, reviewedAt) => { if (state.request.status !== "PENDING") return null; Object.assign(state.request, { status: "APPROVED", approvedTeamId: teamId, reviewedBy, reviewedAt }); return state.request; };
  repository.rejectPending = async (_id, reviewedBy, rejectionReason, reviewedAt) => { Object.assign(state.request, { status: "REJECTED", reviewedBy, rejectionReason, reviewedAt }); return state.request; };
  repository.deployTeam = async () => { if (state.team.status !== "AVAILABLE") return null; state.team.status = "DEPLOYED"; return state.team; };
  repository.findAssignment = async () => state.assignment;
  repository.createAssignment = async data => { state.assignment = { _id: ids.assignment, ...data }; return state.assignment; };
  repository.updateAssignmentForDispatch = async () => state.assignment;
  repository.progressIncident = async () => { state.incident.status = "RESPONSE_IN_PROGRESS"; return state.incident; };
  repository.markDispatched = async () => { if (state.request.status !== "APPROVED") return null; state.request.status = "DISPATCHED"; state.request.dispatchedAt = new Date(); return state.request; };
};
const payload = { incidentId: "INC-001", capability: "RESCUE", requestedPersonnelCount: 8, requestedLocation: "Colombo 03", requiredAt: "2026-10-10T14:00:00.000Z", priority: "HIGH", notes: "Rescue residents" };
const code = (operation, expected) => assert.rejects(operation, error => error.code === expected);

async function run() {
  reset(); const created = await service.create(payload); assert.equal(created.status, "PENDING"); assert.equal(created.requestedPersonnelCount, 8);
  const approved = await service.review(created.requestId, { decision: "APPROVE", teamId: String(ids.team), reviewedBy: "District Officer" }); assert.equal(approved.status, "APPROVED"); assert.equal(state.team.status, "AVAILABLE", "approval must not deploy the team");
  const dispatched = await service.dispatch(created.requestId); assert.equal(dispatched.status, "DISPATCHED"); assert.equal(state.team.status, "DEPLOYED"); assert.equal(state.incident.status, "RESPONSE_IN_PROGRESS"); assert.equal(state.assignment.status, "DISPATCHED");

  reset(); const rejectedRequest = await service.create(payload); const rejected = await service.review(rejectedRequest.requestId, { decision: "REJECT", rejectionReason: "All rescue teams are deployed" }); assert.equal(rejected.status, "REJECTED"); assert.equal(rejected.rejectionReason, "All rescue teams are deployed"); assert.equal(state.team.status, "AVAILABLE");
  reset(); const stale = await service.create(payload); await service.review(stale.requestId, { decision: "APPROVE", teamId: String(ids.team) }); state.team.status = "DEPLOYED"; await code(() => service.dispatch(stale.requestId), "TEAM_UNAVAILABLE"); assert.equal(state.request.status, "APPROVED");
  reset(); const mismatch = await service.create(payload); state.team.name = "Medical Team"; state.team.type = "Emergency Medical"; await code(() => service.review(mismatch.requestId, { decision: "APPROVE", teamId: String(ids.team) }), "TEAM_CAPABILITY_MISMATCH");
  reset(); const insufficient = await service.create(payload); state.team.capacity = 4; await code(() => service.review(insufficient.requestId, { decision: "APPROVE", teamId: String(ids.team) }), "TEAM_CAPACITY_INSUFFICIENT");
  console.log("Operational request tests passed: create, approve, reject, dispatch, stale availability, capability, and capacity rules.");
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { Object.assign(repository, originals); responseRepository.findIncidentByIncidentId = originalIncident; });
