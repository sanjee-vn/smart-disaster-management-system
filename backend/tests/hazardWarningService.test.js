const test = require("node:test");
const assert = require("node:assert/strict");
const { createHazardWarningService } = require("../src/services/hazardWarningService");

const makeHazard = (overrides = {}) => ({
  hazardId: "HZ-2024-001",
  type: "Flood",
  district: "Gampaha",
  severity: "High",
  status: "Active",
  population: "25,000+",
  confidence: "High",
  description: "Water levels are rising.",
  source: "River Gauge Network",
  ds: "Gampaha",
  location: "7.0917 N, 79.9997 E",
  updatedAt: new Date("2026-10-08T10:00:00Z"),
  ...overrides,
});

const makeWarning = (overrides = {}) => ({
  warningId: "WRN-2026-ABC123",
  hazardId: "HZ-2024-001",
  level: "High",
  status: "Published",
  district: "Gampaha",
  areas: ["Gampaha"],
  channels: ["SMS Alert"],
  target: 12480,
  delivered: 0,
  pending: 12480,
  failed: 0,
  escalated: false,
  previousHazardStatus: "Active",
  warning: {
    title: "Flood warning",
    message: "Move to higher ground.",
    instructions: "Avoid flood water.",
    level: "High",
    urgency: "Immediate",
    confidence: "High",
    recommendation: "Prepare to evacuate.",
    districts: ["Gampaha"],
    areas: ["Gampaha"],
    language: "English",
    format: "Text only",
    channels: ["SMS Alert"],
    start: new Date("2026-10-08T10:00:00Z"),
    end: new Date("2026-10-09T10:00:00Z"),
    expiry: new Date("2026-10-09T10:00:00Z"),
    remarks: "",
  },
  deliveryChannels: [{ channel: "SMS Alert", retryCount: 0 }],
  audit: [],
  createdAt: new Date("2026-10-08T10:00:00Z"),
  updatedAt: new Date("2026-10-08T10:00:00Z"),
  ...overrides,
});

const makeValidPayload = (overrides = {}) => ({
  hazardId: "HZ-2024-001",
  warning: {
    level: "High",
    urgency: "Immediate",
    confidence: "High",
    recommendation: "Prepare to evacuate.",
    districts: ["Gampaha"],
    areas: ["Gampaha", "Kelaniya"],
    title: "Flood warning",
    message: "Move to higher ground.",
    instructions: "Avoid flood water.",
    language: "English",
    format: "Text only",
    channels: ["SMS Alert"],
    start: "2026-10-08T10:00:00.000Z",
    end: "2026-10-09T10:00:00.000Z",
    expiry: "2026-10-09T10:00:00.000Z",
    remarks: "",
  },
  ...overrides,
});

const makeFixture = ({ hazard = makeHazard(), warning = makeWarning() } = {}) => {
  const hazardRecords = new Map([[hazard.hazardId, hazard]]);
  const warningRecords = new Map([[warning.warningId, warning]]);
  const draftRecords = new Map();
  const incidentRecords = [];
  let anotherPublishedWarning = false;
  const hazardRepository = {
    findAll: async (filters) => [...hazardRecords.values()].filter((record) => Object.entries(filters).every(([key, value]) => record[key] === value)),
    findById: async (id) => hazardRecords.get(id) || null,
    updateById: async (id, changes) => {
      const current = hazardRecords.get(id);
      if (!current) return null;
      const updated = { ...current, ...changes, updatedAt: new Date("2026-10-08T11:00:00Z") };
      hazardRecords.set(id, updated);
      return updated;
    },
  };
  const warningRepository = {
    findAll: async (filters) => [...warningRecords.values()].filter((record) => Object.entries(filters).every(([key, value]) => record[key] === value)),
    findById: async (id) => warningRecords.get(id) || null,
    create: async (record) => {
      const created = { ...record, createdAt: new Date("2026-10-08T11:00:00Z"), updatedAt: new Date("2026-10-08T11:00:00Z") };
      warningRecords.set(created.warningId, created);
      return created;
    },
    updateById: async (id, update) => {
      const current = warningRecords.get(id);
      if (!current) return null;
      const updated = { ...current, ...(update.$set || {}) };
      if (update.$push?.audit) updated.audit = [...current.audit, update.$push.audit];
      warningRecords.set(id, updated);
      return updated;
    },
    queueRetry: async (id, channel, occurredAt) => {
      const current = warningRecords.get(id);
      if (!current || current.status !== "Published" || !current.deliveryChannels.some((item) => item.channel === channel)) return null;
      const deliveryChannels = current.deliveryChannels.map((item) => item.channel === channel ? { ...item, retryCount: item.retryCount + 1, lastRetryAt: occurredAt } : item);
      const updated = { ...current, deliveryChannels, audit: [...current.audit, { type: "RETRY_QUEUED", channel, occurredAt, message: `Retry queued for ${channel}` }] };
      warningRecords.set(id, updated);
      return updated;
    },
    hasPublishedForHazard: async () => anotherPublishedWarning,
  };
  const warningDraftRepository = {
    findByHazardId: async (id) => draftRecords.get(id) || null,
    saveByHazardId: async (id, details) => {
      const draft = { hazardId: id, warning: details, updatedAt: new Date("2026-10-08T11:00:00Z") };
      draftRecords.set(id, draft);
      return draft;
    },
  };
  const mongoose = {
    isValidObjectId: () => true,
    startSession: async () => ({ withTransaction: async (operation) => operation(), endSession: async () => {} }),
  };
  const incidentModel = {
    create: async (records) => {
      incidentRecords.push(...records);
      return records;
    },
  };
  return {
    service: createHazardWarningService({
      hazardRepository,
      warningRepository,
      warningDraftRepository,
      mongoose,
      incidentModel,
      clock: () => new Date("2026-10-08T12:00:00Z"),
      makeWarningId: () => "WRN-2026-NEW123",
    }),
    hazardRecords,
    warningRecords,
    draftRecords,
    incidentRecords,
    setAnotherPublishedWarning: (value) => { anotherPublishedWarning = value; },
  };
};

const assertError = (error, statusCode, code) => error instanceof Error && error.statusCode === statusCode && error.code === code;

test("lists hazards with validated filters and case-insensitive search", async () => {
  const { service } = makeFixture();
  const hazards = await service.listHazards({ severity: "High", search: "gAmPaHa" });
  assert.equal(hazards.length, 1);
  assert.equal(hazards[0].id, "HZ-2024-001");
  await assert.rejects(service.listHazards({ severity: "Urgent" }), (error) => assertError(error, 400, "INVALID_FILTER"));
  await assert.rejects(service.listHazards({ status: "Unknown" }), (error) => assertError(error, 400, "INVALID_FILTER"));
});

test("reads and updates a hazard using an allow-list", async () => {
  const { service, hazardRecords } = makeFixture();
  assert.equal((await service.getHazard("hz-2024-001")).district, "Gampaha");
  const updated = await service.updateHazard("HZ-2024-001", { severity: "Medium", description: "Updated field report." });
  assert.equal(updated.severity, "Medium");
  assert.equal(hazardRecords.get("HZ-2024-001").description, "Updated field report.");
  await assert.rejects(service.getHazard("HZ-UNKNOWN"), (error) => assertError(error, 404, "HAZARD_NOT_FOUND"));
  await assert.rejects(service.updateHazard("HZ-2024-001", { owner: "unknown" }), (error) => assertError(error, 400, "INVALID_HAZARD_UPDATE"));
  await assert.rejects(service.updateHazard("HZ-2024-001", { status: "Deleted" }), (error) => assertError(error, 400, "INVALID_HAZARD_STATUS"));
  await assert.rejects(service.updateHazard("HZ-2024-001", { description: " " }), (error) => assertError(error, 400, "INVALID_DESCRIPTION"));
  await assert.rejects(service.updateHazard("HZ-UNKNOWN", { status: "Active" }), (error) => assertError(error, 404, "HAZARD_NOT_FOUND"));
});

test("saves and loads one validated draft per hazard", async () => {
  const { service, draftRecords } = makeFixture();
  assert.equal(await service.getDraft("HZ-2024-001"), null);
  const warning = { level: "High", title: "Flood warning", areas: ["Gampaha"] };
  const saved = await service.saveDraft("hz-2024-001", warning);
  assert.equal(saved.hazardId, "HZ-2024-001");
  assert.equal((await service.getDraft("HZ-2024-001")).warning.title, "Flood warning");
  assert.equal(draftRecords.size, 1);
  await assert.rejects(service.saveDraft("HZ-2024-001", {}), (error) => assertError(error, 400, "INVALID_DRAFT"));
  await assert.rejects(service.saveDraft("HZ-2024-001", { title: "Draft", unexpected: true }), (error) => assertError(error, 400, "INVALID_DRAFT_FIELDS"));
  await assert.rejects(service.saveDraft("HZ-MISSING", warning), (error) => assertError(error, 404, "HAZARD_NOT_FOUND"));
  await assert.rejects(service.getDraft("HZ-MISSING"), (error) => assertError(error, 404, "HAZARD_NOT_FOUND"));
});

test("lists and reads warnings with status validation", async () => {
  const { service } = makeFixture();
  assert.equal((await service.listWarnings({ status: "Published" })).length, 1);
  assert.equal((await service.getWarning("wrn-2026-abc123")).id, "WRN-2026-ABC123");
  await assert.rejects(service.listWarnings({ status: "Draft" }), (error) => assertError(error, 400, "INVALID_FILTER"));
  await assert.rejects(service.getWarning("WRN-MISSING"), (error) => assertError(error, 404, "WARNING_NOT_FOUND"));
});

test("publishes a valid warning and updates the hazard in one transaction", async () => {
  const { service, hazardRecords, warningRecords, incidentRecords } = makeFixture();
  const published = await service.publishWarning(makeValidPayload());
  assert.equal(published.id, "WRN-2026-NEW123");
  assert.equal(published.pending, 24960);
  assert.equal(published.delivered, 0);
  assert.equal(published.audit[0].type, "PUBLISHED");
  assert.equal(hazardRecords.get("HZ-2024-001").status, "Warning Issued");
  assert.equal(warningRecords.size, 2);
  assert.equal(incidentRecords.length, 1);
  assert.equal(incidentRecords[0].hazardType, "Flood");
  assert.equal(incidentRecords[0].severity, "WARNING");
});

test("rejects invalid warning payloads and unknown hazards", async () => {
  const { service } = makeFixture();
  await assert.rejects(service.publishWarning({}), (error) => assertError(error, 400, "HAZARD_REQUIRED"));
  await assert.rejects(service.publishWarning(makeValidPayload({ hazardId: "HZ-MISSING" })), (error) => assertError(error, 404, "HAZARD_NOT_FOUND"));
  await assert.rejects(service.publishWarning(makeValidPayload({ warning: { ...makeValidPayload().warning, level: "Urgent" } })), (error) => assertError(error, 400, "INVALID_WARNING_LEVEL"));
  await assert.rejects(service.publishWarning(makeValidPayload({ warning: { ...makeValidPayload().warning, areas: [] } })), (error) => assertError(error, 400, "AREAS_REQUIRED"));
  await assert.rejects(service.publishWarning(makeValidPayload({ warning: { ...makeValidPayload().warning, channels: ["Email"] } })), (error) => assertError(error, 400, "INVALID_CHANNELS"));
  await assert.rejects(service.publishWarning(makeValidPayload({ warning: { ...makeValidPayload().warning, message: "" } })), (error) => assertError(error, 400, "INVALID_WARNING"));
  await assert.rejects(service.publishWarning(makeValidPayload({ warning: { ...makeValidPayload().warning, expiry: "2026-10-08T09:00:00Z" } })), (error) => assertError(error, 400, "INVALID_WARNING_DATES"));
});

test("queues retries without claiming that delivery succeeded", async () => {
  const { service, warningRecords } = makeFixture();
  const updated = await service.queueRetry("WRN-2026-ABC123", "SMS Alert");
  assert.equal(updated.deliveryChannels[0].retryCount, 1);
  assert.equal(updated.delivered, 0);
  assert.equal(updated.audit.at(-1).type, "RETRY_QUEUED");
  assert.equal(warningRecords.get("WRN-2026-ABC123").pending, 12480);
  await assert.rejects(service.queueRetry("WRN-2026-ABC123", "Email"), (error) => assertError(error, 400, "INVALID_CHANNEL"));
  await assert.rejects(service.queueRetry("WRN-MISSING", "SMS Alert"), (error) => assertError(error, 404, "WARNING_NOT_FOUND"));
  const cancelled = makeFixture({ warning: makeWarning({ status: "Cancelled" }) });
  await assert.rejects(cancelled.service.queueRetry("WRN-2026-ABC123", "SMS Alert"), (error) => assertError(error, 409, "WARNING_NOT_ACTIVE"));
  await assert.rejects(service.queueRetry("WRN-2026-ABC123", "Push Notification"), (error) => assertError(error, 400, "CHANNEL_NOT_SELECTED"));
});

test("marks active warnings for review once", async () => {
  const { service } = makeFixture();
  const updated = await service.escalateWarning("WRN-2026-ABC123");
  assert.equal(updated.escalated, true);
  assert.equal(updated.audit.at(-1).type, "ESCALATED");
  await assert.rejects(service.escalateWarning("WRN-2026-ABC123"), (error) => assertError(error, 409, "ALREADY_ESCALATED"));
  await assert.rejects(makeFixture({ warning: makeWarning({ status: "Cancelled" }) }).service.escalateWarning("WRN-2026-ABC123"), (error) => assertError(error, 409, "WARNING_NOT_ACTIVE"));
  await assert.rejects(service.escalateWarning("WRN-MISSING"), (error) => assertError(error, 404, "WARNING_NOT_FOUND"));
});

test("cancels warnings and restores hazard status only when no active warning remains", async () => {
  const first = makeFixture();
  const cancelled = await first.service.cancelWarning("WRN-2026-ABC123");
  assert.equal(cancelled.status, "Cancelled");
  assert.equal(cancelled.audit.at(-1).type, "CANCELLED");
  assert.equal(first.hazardRecords.get("HZ-2024-001").status, "Active");
  await assert.rejects(first.service.cancelWarning("WRN-2026-ABC123"), (error) => assertError(error, 409, "WARNING_ALREADY_CANCELLED"));
  await assert.rejects(first.service.cancelWarning("WRN-MISSING"), (error) => assertError(error, 404, "WARNING_NOT_FOUND"));

  const second = makeFixture();
  second.setAnotherPublishedWarning(true);
  await second.service.cancelWarning("WRN-2026-ABC123");
  assert.equal(second.hazardRecords.get("HZ-2024-001").status, "Active");
});
