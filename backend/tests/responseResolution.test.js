const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const repository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/responseOperationsService");

const ids = {
  incident: new mongoose.Types.ObjectId(), assignment: new mongoose.Types.ObjectId(),
  team1: new mongoose.Types.ObjectId(), team2: new mongoose.Types.ObjectId(), unrelated: new mongoose.Types.ObjectId(),
};
const methods = ["runInTransaction", "findIncidentForDispatch", "findCurrentAssignmentByIncident", "findAnyAssignmentByIncident", "countOutstandingDistributions", "findTeamsForResolution", "releaseDeployedTeams", "completeAssignment", "resolveIncident"];
const originals = Object.fromEntries(methods.map((name) => [name, repository[name]]));

let state;
let failIncidentUpdate;
const snapshot = () => ({
  incident: state.incident && { ...state.incident }, assignment: state.assignment && { ...state.assignment, teamIds: [...state.assignment.teamIds] },
  teams: state.teams.map((team) => ({ ...team })), outstanding: state.outstanding,
});
const reset = () => {
  failIncidentUpdate = false;
  state = {
    incident: { _id: ids.incident, incidentId: "INC-TEST-01", status: "RESPONSE_IN_PROGRESS" },
    assignment: { _id: ids.assignment, responseId: "RSP-TEST-01", incidentId: ids.incident, teamIds: [ids.team1, ids.team2], status: "IN_PROGRESS" },
    teams: [
      { _id: ids.team1, status: "DEPLOYED" }, { _id: ids.team2, status: "DEPLOYED" },
      { _id: ids.unrelated, status: "DEPLOYED" },
    ],
    outstanding: 0,
  };
  repository.runInTransaction = async (operation) => {
    const before = snapshot();
    try { return await operation({}); } catch (error) { state = before; throw error; }
  };
  repository.findIncidentForDispatch = async (incidentId) => state.incident?.incidentId === incidentId ? state.incident : null;
  repository.findCurrentAssignmentByIncident = async () => state.assignment;
  repository.findAnyAssignmentByIncident = async () => state.assignment;
  repository.countOutstandingDistributions = async () => state.outstanding;
  repository.findTeamsForResolution = async (teamIds) => state.teams.filter((team) => teamIds.map(String).includes(team._id.toString()));
  repository.releaseDeployedTeams = async (teamIds) => {
    let modifiedCount = 0;
    state.teams = state.teams.map((team) => {
      if (teamIds.map(String).includes(team._id.toString()) && team.status === "DEPLOYED") { modifiedCount += 1; return { ...team, status: "AVAILABLE" }; }
      return team;
    });
    return { modifiedCount };
  };
  repository.completeAssignment = async () => {
    if (!["DISPATCHED", "IN_PROGRESS"].includes(state.assignment.status)) return null;
    state.assignment.status = "COMPLETED";
    return state.assignment;
  };
  repository.resolveIncident = async () => {
    if (failIncidentUpdate) throw new Error("simulated final update failure");
    state.incident.status = "RESOLVED";
    return state.incident;
  };
};
const expectCode = (operation, code) => assert.rejects(operation, (error) => error.code === code);

const run = async () => {
  reset();
  const result = await service.resolveResponse("INC-TEST-01");
  assert.equal(result.incidentStatus, "RESOLVED");
  assert.equal(result.responseStatus, "COMPLETED");
  assert.equal(state.incident.status, "RESOLVED");
  assert.equal(state.assignment.status, "COMPLETED");
  assert.equal(state.teams.find((team) => team._id.equals(ids.team1)).status, "AVAILABLE");
  assert.equal(state.teams.find((team) => team._id.equals(ids.team2)).status, "AVAILABLE");
  assert.equal(state.teams.find((team) => team._id.equals(ids.unrelated)).status, "DEPLOYED", "unrelated team must remain unchanged");

  reset(); state.incident.status = "RESOLVED";
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "INCIDENT_ALREADY_RESOLVED");
  reset(); state.incident = null;
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "INCIDENT_NOT_FOUND");
  reset(); state.assignment = null;
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "RESPONSE_ASSIGNMENT_NOT_FOUND");
  reset(); state.assignment.status = "PLANNED";
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "RESPONSE_NOT_RESOLVABLE");
  reset(); state.outstanding = 1;
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "OUTSTANDING_DISTRIBUTIONS");
  assert.equal(state.incident.status, "RESPONSE_IN_PROGRESS");

  reset(); failIncidentUpdate = true;
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "RESPONSE_RESOLUTION_FAILED");
  assert.equal(state.incident.status, "RESPONSE_IN_PROGRESS");
  assert.equal(state.assignment.status, "IN_PROGRESS");
  assert.equal(state.teams.find((team) => team._id.equals(ids.team1)).status, "DEPLOYED");

  reset();
  repository.runInTransaction = async () => { throw new Error("Transaction numbers are only allowed on a replica set member or mongos"); };
  await expectCode(() => service.resolveResponse("INC-TEST-01"), "TRANSACTION_UNAVAILABLE");
  console.log("Response resolution tests passed: validation, scoped team release, rollback, and transaction availability.");
};

run().finally(() => Object.assign(repository, originals)).catch((error) => { console.error(error); process.exitCode = 1; });
