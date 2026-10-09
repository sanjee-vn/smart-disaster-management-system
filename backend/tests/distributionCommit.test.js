const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const distributionRepository = require("../src/repositories/distributionRepository");
const shelterRepository = require("../src/repositories/shelterRepository");
const inventoryRepository = require("../src/repositories/inventoryRepository");
const deliveryResourceRepository = require("../src/repositories/deliveryResourceRepository");
const resourceOwnerRepository = require("../src/repositories/resourceOwnerRepository");
const responseOperationsRepository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/distributionService");

const ids = {
  incident: new mongoose.Types.ObjectId(), assignment: new mongoose.Types.ObjectId(), shelter: new mongoose.Types.ObjectId(),
  inventory: new mongoose.Types.ObjectId(), owner: new mongoose.Types.ObjectId(), delivery: new mongoose.Types.ObjectId(),
  distribution: new mongoose.Types.ObjectId(),
};

const targets = {
  mongoose: [mongoose, ["startSession"]],
  distribution: [distributionRepository, ["findByRequestId", "create", "findByIncidentId"]],
  shelter: [shelterRepository, ["findByIdInSession", "addIncomingResource"]],
  inventory: [inventoryRepository, ["findByIdInSession", "decrementAvailableStock"]],
  delivery: [deliveryResourceRepository, ["findByIdInSession", "reserveAvailable"]],
  owner: [resourceOwnerRepository, ["findByIdInSession"]],
  response: [responseOperationsRepository, ["findIncidentForDispatch", "findAssignmentForDispatch", "findExistingAssignmentForDispatch"]],
};
const originals = Object.fromEntries(Object.entries(targets).map(([key, [object, names]]) => [key, Object.fromEntries(names.map((name) => [name, object[name]]))]));

const validPayload = {
  requestId: "request-test-001", incidentId: "INC-TEST-01", responseId: "RSP-TEST-01",
  shelterId: ids.shelter.toString(), inventoryItemId: ids.inventory.toString(), resourceOwnerId: ids.owner.toString(),
  deliveryResourceId: ids.delivery.toString(), quantity: 100, eta: "2026-10-08T10:00:00.000Z", notes: "Test delivery",
};

let state;
let failShelterUpdate;
let inventoryConflict;
let deliveryConflict;
const cloneState = () => ({
  ...state,
  incident: state.incident && { ...state.incident },
  assignment: state.assignment && { ...state.assignment },
  shelter: state.shelter && { ...state.shelter, incomingResources: [...state.shelter.incomingResources] },
  inventory: state.inventory && { ...state.inventory },
  owner: state.owner && { ...state.owner },
  delivery: state.delivery && { ...state.delivery },
  distributions: state.distributions.map((distribution) => ({ ...distribution })),
});

const reset = () => {
  failShelterUpdate = false;
  inventoryConflict = false;
  deliveryConflict = false;
  state = {
    incident: { _id: ids.incident, incidentId: "INC-TEST-01", status: "RESPONSE_IN_PROGRESS" },
    assignment: { _id: ids.assignment, responseId: "RSP-TEST-01", incidentId: ids.incident, status: "DISPATCHED", requiredCapabilities: ["FOOD", "WATER", "MEDICINE"] },
    shelter: { _id: ids.shelter, incidentId: "INC-TEST-01", incomingResources: [] },
    inventory: { _id: ids.inventory, ownerId: ids.owner, category: "Water", itemName: "Water 1L", unit: "bottles", availableQuantity: 1000, status: "ACTIVE" },
    owner: { _id: ids.owner, name: "Government Central Warehouse" },
    delivery: { _id: ids.delivery, name: "DMC Truck 01", status: "AVAILABLE" },
    distributions: [],
  };

  mongoose.startSession = async () => ({
    withTransaction: async (operation) => {
      const snapshot = cloneState();
      try { await operation(); } catch (error) { state = snapshot; throw error; }
    },
    endSession: async () => {},
  });
  responseOperationsRepository.findIncidentForDispatch = async (incidentId) => state.incident?.incidentId === incidentId ? state.incident : null;
  responseOperationsRepository.findAssignmentForDispatch = async (responseId) => state.assignment?.responseId === responseId ? state.assignment : null;
  responseOperationsRepository.findExistingAssignmentForDispatch = async () => state.assignment;
  shelterRepository.findByIdInSession = async (id) => state.shelter?._id.toString() === id.toString() ? state.shelter : null;
  inventoryRepository.findByIdInSession = async (id) => state.inventory?._id.toString() === id.toString() ? state.inventory : null;
  resourceOwnerRepository.findByIdInSession = async (id) => state.owner?._id.toString() === id.toString() ? state.owner : null;
  deliveryResourceRepository.findByIdInSession = async (id) => state.delivery?._id.toString() === id.toString() ? state.delivery : null;
  inventoryRepository.decrementAvailableStock = async (_id, quantity) => {
    if (inventoryConflict) return null;
    if (state.inventory.availableQuantity < quantity) return null;
    state.inventory.availableQuantity -= quantity;
    return state.inventory;
  };
  deliveryResourceRepository.reserveAvailable = async () => {
    if (deliveryConflict) return null;
    if (state.delivery.status !== "AVAILABLE") return null;
    state.delivery.status = "IN_USE";
    return state.delivery;
  };
  distributionRepository.create = async (data) => {
    const distribution = { _id: ids.distribution, ...data };
    state.distributions.push(distribution);
    return distribution;
  };
  distributionRepository.findByRequestId = async (requestId) => {
    const distribution = state.distributions.find((item) => item.requestId === requestId);
    return distribution ? { ...distribution, incidentId: state.incident, responseAssignmentId: state.assignment, shelterId: state.shelter, inventoryItemId: state.inventory, resourceOwnerId: state.owner, deliveryResourceId: state.delivery } : null;
  };
  distributionRepository.findByIncidentId = async () => state.distributions;
  shelterRepository.addIncomingResource = async (_id, resource) => {
    if (failShelterUpdate) throw new Error("simulated later-step failure");
    state.shelter.incomingResources.push(resource);
    return state.shelter;
  };
};

const expectCode = (operation, code) => assert.rejects(operation, (error) => error.code === code);

const run = async () => {
  reset();
  const result = await service.createDistribution(validPayload);
  assert.match(result.distributionId, /^DST-\d{4}-[A-F0-9]{8}$/);
  assert.equal(result.status, "PENDING");
  assert.equal(result.incidentId, "INC-TEST-01");
  assert.equal(result.responseId, "RSP-TEST-01");
  assert.equal(state.inventory.availableQuantity, 900);
  assert.equal(state.delivery.status, "IN_USE");
  assert.equal(state.distributions.length, 1);
  assert.equal(state.shelter.incomingResources.length, 1);
  const monitored = await service.getDistributions({ incidentId: "INC-TEST-01" });
  assert.equal(monitored.length, 1);
  assert.equal(monitored[0].distributionId, result.distributionId);

  const repeated = await service.createDistribution(validPayload);
  assert.equal(repeated.distributionId, result.distributionId);
  assert.equal(state.distributions.length, 1, "one request ID must not create duplicate distributions");
  assert.equal(state.inventory.availableQuantity, 900, "idempotent replay must not deduct stock again");

  await expectCode(() => service.createDistribution({ ...validPayload, quantity: 101 }), "IDEMPOTENCY_CONFLICT");
  assert.equal(state.distributions.length, 1);
  assert.equal(state.inventory.availableQuantity, 900);

  for (const [payload, code] of [
    [{ ...validPayload, incidentId: "" }, "INCIDENT_NOT_FOUND"],
    [{ ...validPayload, shelterId: "invalid-id" }, "SHELTER_NOT_FOUND"],
    [{ ...validPayload, inventoryItemId: "invalid-id" }, "INVENTORY_ITEM_NOT_FOUND"],
    [{ ...validPayload, resourceOwnerId: "invalid-id" }, "RESOURCE_OWNER_NOT_FOUND"],
    [{ ...validPayload, quantity: "" }, "INVALID_QUANTITY"],
    [{ ...validPayload, quantity: -1 }, "INVALID_QUANTITY"],
    [{ ...validPayload, deliveryResourceId: "invalid-id" }, "DELIVERY_RESOURCE_NOT_FOUND"],
    [{ ...validPayload, eta: "not-a-date" }, "INVALID_ETA"],
    [{ ...validPayload, requestId: "  " }, "INVALID_IDEMPOTENCY_KEY"],
    [{ ...validPayload, requestId: "r".repeat(201) }, "INVALID_IDEMPOTENCY_KEY"],
    [{ ...validPayload, notes: "x".repeat(501) }, "INVALID_NOTES"],
  ]) {
    reset();
    await expectCode(() => service.createDistribution(payload), code);
    assert.equal(state.inventory.availableQuantity, 1000, `${code} must not change stock`);
  }

  reset(); state.inventory.availableQuantity = 50;
  await expectCode(() => service.createDistribution(validPayload), "INSUFFICIENT_STOCK");
  assert.equal(state.inventory.availableQuantity, 50);

  reset(); state.delivery.status = "IN_USE";
  await expectCode(() => service.createDistribution(validPayload), "DELIVERY_RESOURCE_UNAVAILABLE");
  assert.equal(state.inventory.availableQuantity, 1000);

  reset(); state.incident.status = "RESOLVED";
  await expectCode(() => service.createDistribution(validPayload), "INCIDENT_NOT_ACTIVE");

  reset(); state.assignment = null;
  await expectCode(() => service.createDistribution({ ...validPayload, responseId: undefined }), "RELIEF_CONTEXT_REQUIRED");

  reset();
  await expectCode(() => service.createDistribution({ ...validPayload, responseId: "RSP-MISSING" }), "RESPONSE_ASSIGNMENT_NOT_FOUND");

  reset(); state.shelter.incidentId = "INC-OTHER";
  await expectCode(() => service.createDistribution(validPayload), "SHELTER_NOT_FOUND");

  reset(); state.assignment.requiredCapabilities = ["FOOD"];
  await expectCode(() => service.createDistribution(validPayload), "RESOURCE_NOT_REQUIRED");

  reset(); state.inventory.status = "INACTIVE";
  await expectCode(() => service.createDistribution(validPayload), "INVENTORY_ITEM_INACTIVE");

  reset(); state.inventory.ownerId = new mongoose.Types.ObjectId();
  await expectCode(() => service.createDistribution(validPayload), "RESOURCE_OWNER_NOT_FOUND");

  reset();
  await expectCode(() => service.createDistribution({ ...validPayload, requestId: "" }), "INVALID_IDEMPOTENCY_KEY");

  reset(); inventoryConflict = true;
  await expectCode(() => service.createDistribution(validPayload), "INVENTORY_CONFLICT");
  assert.equal(state.inventory.availableQuantity, 1000);
  assert.equal(state.delivery.status, "AVAILABLE");

  reset(); deliveryConflict = true;
  await expectCode(() => service.createDistribution(validPayload), "DELIVERY_RESOURCE_CONFLICT");
  assert.equal(state.inventory.availableQuantity, 1000, "inventory must roll back after a delivery-resource conflict");
  assert.equal(state.delivery.status, "AVAILABLE");

  reset(); state.shelter = null;
  await expectCode(() => service.createDistribution(validPayload), "SHELTER_NOT_FOUND");

  reset(); state.inventory = null;
  await expectCode(() => service.createDistribution(validPayload), "INVENTORY_ITEM_NOT_FOUND");

  reset();
  await expectCode(() => service.createDistribution({ ...validPayload, quantity: 0 }), "INVALID_QUANTITY");

  reset(); failShelterUpdate = true;
  await expectCode(() => service.createDistribution(validPayload), "DISTRIBUTION_COMMIT_FAILED");
  assert.equal(state.inventory.availableQuantity, 1000, "inventory deduction must roll back");
  assert.equal(state.delivery.status, "AVAILABLE", "delivery reservation must roll back");
  assert.equal(state.distributions.length, 0, "distribution creation must roll back");
  assert.equal(state.shelter.incomingResources.length, 0, "shelter update must roll back");

  reset();
  mongoose.startSession = async () => ({ withTransaction: async () => { throw new Error("Transaction numbers are only allowed on a replica set member or mongos"); }, endSession: async () => {} });
  await expectCode(() => service.createDistribution(validPayload), "TRANSACTION_UNAVAILABLE");

  console.log("Distribution commit tests passed: success, validation, idempotency, rollback, and transaction availability.");
};

run().finally(() => {
  for (const [key, [object]] of Object.entries(targets)) Object.assign(object, originals[key]);
}).catch((error) => { console.error(error); process.exitCode = 1; });
