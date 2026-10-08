const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const repository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/responseOperationsService");

const incidentObjectId = new mongoose.Types.ObjectId();
const assignmentObjectId = new mongoose.Types.ObjectId();
const teamObjectIds = [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()];
const agencyObjectId = new mongoose.Types.ObjectId();
const methodNames = [
  "runInTransaction", "findIncidentForDispatch", "findAssignmentForDispatch", "findExistingAssignmentForDispatch", "findTeamsForDispatch",
  "deployAvailableTeams", "updatePlannedAssignment", "createAssignment",
  "updateIncidentResponseStatus", "findAssignmentWithDetailsById",
];
const originals = Object.fromEntries(methodNames.map((name) => [name, repository[name]]));

const validPayload = {
  incidentId: "INC-TEST-01", responseId: "RSP-TEST-01",
  teamIds: teamObjectIds.map(String), priority: "CRITICAL",
  destination: "Colombo Flood Zone", instructions: "Deploy for rescue operations.",
  eta: "2026-10-08T10:00:00.000Z",
};

let state;
const reset = () => {
  state = {
    incident: { _id: incidentObjectId, incidentId: "INC-TEST-01", status: "ACTIVE" },
    assignment: { _id: assignmentObjectId, responseId: "RSP-TEST-01", incidentId: incidentObjectId, status: "PLANNED" },
    teams: teamObjectIds.map((_id, index) => ({ _id, name: `Team ${index + 1}`, agencyId: agencyObjectId, type: "Rescue", status: "AVAILABLE" })),
  };
  repository.runInTransaction = async (operation) => {
    const snapshot = structuredClone(state);
    try { return await operation({}); } catch (error) { state = snapshot; throw error; }
  };
  repository.findIncidentForDispatch = async (incidentId) => incidentId === state.incident?.incidentId ? state.incident : null;
  repository.findAssignmentForDispatch = async (responseId) => responseId === state.assignment?.responseId ? state.assignment : null;
  repository.findExistingAssignmentForDispatch = async () => state.assignment;
  repository.findTeamsForDispatch = async (ids) => state.teams.filter((team) => ids.includes(team._id.toString()));
  repository.deployAvailableTeams = async (ids) => {
    let modifiedCount = 0;
    state.teams = state.teams.map((team) => {
      if (ids.includes(team._id.toString()) && team.status === "AVAILABLE") { modifiedCount += 1; return { ...team, status: "DEPLOYED" }; }
      return team;
    });
    return { modifiedCount };
  };
  repository.updatePlannedAssignment = async (_id, update) => {
    if (state.assignment.status !== "PLANNED") return null;
    state.assignment = { ...state.assignment, ...update };
    return state.assignment;
  };
  repository.createAssignment = async (assignment) => ({ _id: assignmentObjectId, ...assignment });
  repository.updateIncidentResponseStatus = async () => { state.incident.status = "RESPONSE_IN_PROGRESS"; return state.incident; };
  repository.findAssignmentWithDetailsById = async () => ({
    ...state.assignment,
    incidentId: { ...state.incident },
    teamIds: state.teams.filter((team) => state.assignment.teamIds.map(String).includes(team._id.toString())).map((team) => ({
      ...team, agencyId: { _id: agencyObjectId, name: "Test Agency", type: "DMC" },
    })),
  });
};

const expectCode = async (operation, code) => assert.rejects(operation, (error) => error.code === code);

const run = async () => {
  reset();
  const result = await service.dispatchResponseAssignment(validPayload);
  assert.equal(result.status, "DISPATCHED");
  assert.equal(result.responseId, "RSP-TEST-01");
  assert.equal(state.assignment.status, "DISPATCHED");
  assert.ok(state.teams.every((team) => team.status === "DEPLOYED"));
  assert.equal(state.incident.status, "RESPONSE_IN_PROGRESS");

  reset(); state.incident = null;
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "INCIDENT_NOT_FOUND");

  reset(); state.assignment = null;
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "RESPONSE_ASSIGNMENT_NOT_FOUND");

  reset(); state.teams.pop();
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "RESPONSE_TEAM_NOT_FOUND");

  reset(); state.teams[1].status = "DEPLOYED";
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "TEAM_UNAVAILABLE");

  reset();
  await expectCode(() => service.dispatchResponseAssignment({ ...validPayload, teamIds: [validPayload.teamIds[0], validPayload.teamIds[0]] }), "DUPLICATE_TEAM_SELECTION");

  reset();
  await expectCode(() => service.dispatchResponseAssignment({ ...validPayload, priority: "URGENT" }), "INVALID_PRIORITY");

  reset();
  await expectCode(() => service.dispatchResponseAssignment({ ...validPayload, eta: "not-a-date" }), "INVALID_ETA");

  reset(); state.assignment.status = "DISPATCHED";
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "RESPONSE_ASSIGNMENT_NOT_DISPATCHABLE");

  reset();
  await expectCode(() => service.dispatchResponseAssignment({ ...validPayload, responseId: undefined }), "RESPONSE_ASSIGNMENT_ALREADY_EXISTS");

  reset();
  repository.updatePlannedAssignment = async () => null;
  await expectCode(() => service.dispatchResponseAssignment(validPayload), "RESPONSE_ASSIGNMENT_NOT_DISPATCHABLE");
  assert.ok(state.teams.every((team) => team.status === "AVAILABLE"), "Transaction failure must roll back team deployment");
  assert.equal(state.incident.status, "ACTIVE", "Transaction failure must preserve incident status");

  reset();
  repository.runInTransaction = async () => { throw new Error("Transaction numbers are only allowed on a replica set member or mongos"); };
  await assert.rejects(() => service.dispatchResponseAssignment(validPayload), (error) => error.code === "TRANSACTION_UNAVAILABLE" && !error.message.includes("Transaction numbers"));

  console.log("Assignment dispatch tests passed: validation, idempotency, atomic transitions, and rollback behavior.");
};

run()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => methodNames.forEach((name) => { repository[name] = originals[name]; }));
