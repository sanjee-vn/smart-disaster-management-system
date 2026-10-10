const { test } = require("node:test");
const assert = require("node:assert/strict");
const GroundReport = require("../src/modules/reports/report.model");
const service = require("../src/modules/reports/report.service");
const valid = {
  title: "Flood near Galle Road", description: "Water level is rising.",
  disasterType: "Flood", latitude: 6.0329, longitude: 80.2168,
  citizenId: "test-citizen-001",
};

test("service whitelists fields and forces PENDING", async (t) => {
  t.mock.method(GroundReport, "create", async data => data);
  const result = await service.createGroundReport({ ...valid, status: "APPROVED", createdAt: "fake" });
  assert.equal(result.status, "PENDING");
  assert.equal(result.photo, null);
  assert.equal(result.createdAt, undefined);
  assert.equal(GroundReport.create.mock.callCount(), 1);
});

test("service propagates database failure", async (t) => {
  t.mock.method(GroundReport, "create", async () => { throw new Error("DB unavailable"); });
  await assert.rejects(service.createGroundReport(valid), /DB unavailable/);
});

