const assert = require("node:assert/strict");
const test = require("node:test");
const { toWarningResponse } = require("./hazardWarningService");

test("serializes warnings using the nested warning details", () => {
  const result = toWarningResponse({
    warningId: "WRN-2026-ABC123",
    warning: { title: "Flood Warning", message: "Move to higher ground" },
    areas: ["Colombo"],
    channels: ["SMS Alert"],
    target: 100,
    delivered: 0,
    pending: 100,
    failed: 0,
    escalated: false,
    deliveryChannels: [],
    audit: [],
  });

  assert.equal(result.title, "Flood Warning");
  assert.equal(result.warning.message, "Move to higher ground");
  assert.deepEqual(result.areas, ["Colombo"]);
});

test("serializes legacy flat warnings without throwing", () => {
  const result = toWarningResponse({
    warningId: "WRN-LEGACY-001",
    hazardType: "Flood",
    severity: "WARNING",
    targetArea: "Kelaniya",
    message: "Rising water levels reported",
    district: "Gampaha",
    status: "ACTIVE",
  });

  assert.equal(result.title, "Flood Warning");
  assert.equal(result.level, "WARNING");
  assert.deepEqual(result.areas, ["Kelaniya"]);
  assert.equal(result.warning.message, "Rising water levels reported");
  assert.equal(result.target, 0);
});
