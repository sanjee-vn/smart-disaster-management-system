const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const distributionRepository = require("../src/repositories/distributionRepository");
const deliveryResourceRepository = require("../src/repositories/deliveryResourceRepository");
const shelterRepository = require("../src/repositories/shelterRepository");
const responseOperationsRepository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/distributionService");

const ids = {
  incident: new mongoose.Types.ObjectId(), shelter: new mongoose.Types.ObjectId(),
  delivery: new mongoose.Types.ObjectId(), distribution: new mongoose.Types.ObjectId(),
  inventory: new mongoose.Types.ObjectId(), owner: new mongoose.Types.ObjectId(),
};

const targets = {
  mongoose: [mongoose, ["startSession"]],
  distribution: [distributionRepository, ["findForCompletion", "markDelivered", "findByDistributionId"]],
  delivery: [deliveryResourceRepository, ["releaseInUse"]],
  shelter: [shelterRepository, ["markIncomingResourceDelivered"]],
  response: [responseOperationsRepository, ["findIncidentForDispatch"]],
};
const originals = Object.fromEntries(Object.entries(targets).map(([key, [object, names]]) => [key, Object.fromEntries(names.map((name) => [name, object[name]]))]));

let state;
let deliveryConflict;
let shelterConflict;

const snapshot = () => ({
  distribution: { ...state.distribution },
  delivery: { ...state.delivery },
  shelter: { ...state.shelter, incomingResources: state.shelter.incomingResources.map((resource) => ({ ...resource })) },
});

const populatedDistribution = () => ({
  ...state.distribution,
  incidentId: { ...state.incident },
  shelterId: { ...state.shelter },
  inventoryItemId: { _id: ids.inventory, itemName: "Water 1L", category: "Water", unit: "bottles" },
  resourceOwnerId: { _id: ids.owner, name: "Government Central Warehouse", type: "GOVERNMENT" },
  deliveryResourceId: { ...state.delivery },
});

const reset = () => {
  deliveryConflict = false;
  shelterConflict = false;
  state = {
    incident: { _id: ids.incident, incidentId: "INC-TEST-01", hazardType: "Flood", district: "Colombo" },
    distribution: {
      _id: ids.distribution, distributionId: "DST-2026-TEST0001", incidentId: ids.incident,
      shelterId: ids.shelter, inventoryItemId: ids.inventory, resourceOwnerId: ids.owner,
      deliveryResourceId: ids.delivery, quantity: 100, status: "EN_ROUTE", createdBy: "District Officer",
    },
    delivery: { _id: ids.delivery, name: "DMC Truck 01", type: "Truck", status: "IN_USE" },
    shelter: { _id: ids.shelter, name: "Test Shelter", shelterId: "SHT-TEST-01", district: "Colombo", incomingResources: [{ distributionId: "DST-2026-TEST0001", status: "EN_ROUTE" }] },
  };

  mongoose.startSession = async () => ({
    withTransaction: async (operation) => {
      const before = snapshot();
      try { await operation(); } catch (error) {
        state.distribution = before.distribution;
        state.delivery = before.delivery;
        state.shelter = before.shelter;
        throw error;
      }
    },
    endSession: async () => {},
  });
  responseOperationsRepository.findIncidentForDispatch = async (incidentId) => state.incident.incidentId === incidentId ? state.incident : null;
  distributionRepository.findForCompletion = async (distributionId, incidentId) => state.distribution.distributionId === distributionId && state.distribution.incidentId.toString() === incidentId.toString() ? state.distribution : null;
  distributionRepository.markDelivered = async () => {
    if (state.distribution.status !== "EN_ROUTE") return null;
    state.distribution.status = "DELIVERED";
    state.distribution.deliveredAt = new Date();
    return state.distribution;
  };
  distributionRepository.findByDistributionId = async (distributionId) => state.distribution.distributionId === distributionId ? populatedDistribution() : null;
  deliveryResourceRepository.releaseInUse = async () => {
    if (deliveryConflict || state.delivery.status !== "IN_USE") return null;
    state.delivery.status = "AVAILABLE";
    return state.delivery;
  };
  shelterRepository.markIncomingResourceDelivered = async () => {
    if (shelterConflict) return false;
    state.shelter.incomingResources[0].status = "Delivered";
    return true;
  };
};

const expectCode = (operation, code) => assert.rejects(operation, (error) => error.code === code);

const run = async () => {
  reset();
  const delivered = await service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" });
  assert.equal(delivered.status, "DELIVERED");
  assert.ok(delivered.deliveredAt);
  assert.equal(state.delivery.status, "AVAILABLE");
  assert.equal(state.shelter.incomingResources[0].status, "Delivered");

  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" }), "DISTRIBUTION_ALREADY_DELIVERED");

  reset(); state.distribution.status = "PENDING_SYNC";
  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" }), "INVALID_DISTRIBUTION_TRANSITION");

  reset();
  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-WRONG" }), "INCIDENT_NOT_FOUND");

  reset(); deliveryConflict = true;
  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" }), "DELIVERY_RESOURCE_CONFLICT");
  assert.equal(state.distribution.status, "EN_ROUTE", "distribution transition must roll back");
  assert.equal(state.delivery.status, "IN_USE");

  reset(); shelterConflict = true;
  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" }), "SHELTER_RESOURCE_NOT_FOUND");
  assert.equal(state.distribution.status, "EN_ROUTE", "distribution transition must roll back after shelter conflict");
  assert.equal(state.delivery.status, "IN_USE", "delivery release must roll back after shelter conflict");

  reset();
  mongoose.startSession = async () => ({ withTransaction: async () => { throw new Error("Transactions are not supported"); }, endSession: async () => {} });
  await expectCode(() => service.markDistributionDelivered("DST-2026-TEST0001", { incidentId: "INC-TEST-01" }), "TRANSACTION_UNAVAILABLE");

  console.log("Distribution delivery tests passed: atomic completion, resource release, shelter update, transition validation, and rollback behavior.");
};

run().finally(() => {
  for (const [key, [object]] of Object.entries(targets)) Object.assign(object, originals[key]);
}).catch((error) => { console.error(error); process.exitCode = 1; });
