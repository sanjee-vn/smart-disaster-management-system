const { test } = require("node:test");
const assert = require("node:assert/strict");
const GroundReport = require("../src/modules/reports/report.model");
const valid = {
  title: "Flood near Galle Road", description: "Water level is rising.",
  disasterType: "Flood", latitude: 6.0329, longitude: 80.2168,
  citizenId: "test-citizen-001",
};

test("model validates required fields, ranges and defaults without database access", async () => {
  const report = new GroundReport(valid);
  await report.validate();
  assert.equal(report.status, "PENDING");
  assert.equal(report.photo, null);
  await assert.rejects(new GroundReport({ ...valid, latitude: 91 }).validate());
  await assert.rejects(new GroundReport({ ...valid, disasterType: "Invalid" }).validate());
  await assert.rejects(new GroundReport({}).validate());
  assert.ok(GroundReport.schema.path("createdAt"));
  assert.ok(GroundReport.schema.path("updatedAt"));
});

