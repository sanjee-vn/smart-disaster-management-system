const assert = require("node:assert/strict");
const repository = require("../src/repositories/responseOperationsRepository");
const service = require("../src/services/responseOperationsService");

const originalFind = repository.findWarningByWarningId;
const originalUpdate = repository.updateWarningByWarningId;

const baseWarning = {
  _id: { toString: () => "warning-object-id" },
  warningId: "WRN-TEST-01",
  hazardType: "Flood",
  severity: "WATCH",
  targetArea: "Colombo",
  district: "Colombo",
  status: "DRAFT",
  createdAt: new Date("2026-10-07T00:00:00.000Z"),
};

let storedWarning;
let updateCount;

const resetStore = () => {
  storedWarning = { ...baseWarning };
  updateCount = 0;
  repository.findWarningByWarningId = async (warningId) => warningId === storedWarning.warningId ? { ...storedWarning } : null;
  repository.updateWarningByWarningId = async (warningId, update) => {
    if (warningId !== storedWarning.warningId) return null;
    updateCount += 1;
    storedWarning = { ...storedWarning, ...update };
    return { ...storedWarning };
  };
};

const expectError = async (operation, code) => {
  await assert.rejects(operation, (error) => error.code === code);
};

const run = async () => {
  resetStore();
  const issued = await service.updateWarning("WRN-TEST-01", {
    targetArea: "  Colombo District  ", severity: "EMERGENCY",
    message: " Move to designated safe areas. ", issuedBy: " Assessment Officer ", issue: true,
  });
  assert.equal(issued.status, "ACTIVE");
  assert.equal(issued.targetArea, "Colombo District");
  assert.equal(issued.message, "Move to designated safe areas.");
  assert.ok(issued.issuedAt instanceof Date);

  resetStore();
  await expectError(() => service.updateWarning("WRN-TEST-01", { targetArea: "", severity: "WATCH", message: "Message" }), "INVALID_TARGET_AREA");
  await expectError(() => service.updateWarning("WRN-TEST-01", { targetArea: "Colombo", severity: "SEVERE", message: "Message" }), "INVALID_SEVERITY");
  await expectError(() => service.updateWarning("WRN-TEST-01", { targetArea: "Colombo", severity: "WARNING", message: "  " }), "INVALID_WARNING_MESSAGE");
  await expectError(() => service.updateWarning("UNKNOWN", { targetArea: "Colombo", severity: "WARNING", message: "Message" }), "WARNING_NOT_FOUND");

  resetStore();
  const payload = { targetArea: "Colombo", severity: "WARNING", message: "Prepare to evacuate.", issuedBy: "Duty Officer", issue: true };
  await service.updateWarning("WRN-TEST-01", payload);
  await service.updateWarning("WRN-TEST-01", payload);
  assert.equal(storedWarning.warningId, "WRN-TEST-01");
  assert.equal(updateCount, 2);
  assert.equal(Object.keys({ [storedWarning.warningId]: storedWarning }).length, 1, "Repeated issue must update the same warning, not create another record");

  resetStore();
  await expectError(() => service.updateWarning("WRN-TEST-01", { targetArea: "Colombo", severity: "WARNING", message: "Message", issuedBy: "", issue: true }), "INVALID_ISSUING_OFFICER");
  console.log("Warning update tests passed: validation, issuing, not-found, and repeat-update behavior.");
};

run()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => {
    repository.findWarningByWarningId = originalFind;
    repository.updateWarningByWarningId = originalUpdate;
  });
