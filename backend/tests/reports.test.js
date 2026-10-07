const { test, after, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const { validateGroundReport } = require("../src/modules/reports/report.validation");
const GroundReport = require("../src/modules/reports/report.model");
const service = require("../src/modules/reports/report.service");
const app = require("../src/app");
const authenticatedId = '507f1f77bcf86cd799439011';
mock.method(require('../src/modules/auth/auth.service'), 'authenticate', async () => ({ user: { id: authenticatedId }, tokenId: 'test-token' }));

const valid = {
  title: "Flood near Galle Road", description: "Water level is rising.",
  disasterType: "Flood", latitude: 6.0329, longitude: 80.2168,
  citizenId: "test-citizen-001",
};

test("valid input is trimmed, optional photo defaults to null, protected fields excluded", () => {
  const { data, errors } = validateGroundReport({ ...valid, title: " Flood ", status: "APPROVED", createdAt: "fake" });
  assert.deepEqual(errors, {});
  assert.equal(data.title, "Flood");
  assert.equal(data.photo, null);
  assert.equal(data.status, undefined);
  assert.equal(data.createdAt, undefined);
});

for (const field of Object.keys(valid)) {
  test(`missing ${field} is rejected`, () => {
    const input = { ...valid };
    delete input[field];
    assert.ok(validateGroundReport(input).errors[field]);
  });
}

for (const [field, values] of Object.entries({
  title: [" ", 42, "x".repeat(151)],
  description: [" ", {}, "x".repeat(5001)],
  citizenId: [" ", 42, "x".repeat(101)],
  disasterType: ["Tsunami", null, {}],
  latitude: [-91, 91, "6", null, Infinity, NaN],
  longitude: [-181, 181, "80", null, Infinity, NaN],
  photo: [42, "", "data:image/png;base64,abc", "javascript:alert(1)", "https://example.com/" + "x".repeat(2048)],
})) {
  for (const [index, value] of values.entries()) {
    test(`invalid ${field} case ${index + 1}`, () => {
      assert.ok(validateGroundReport({ ...valid, [field]: value }).errors[field]);
    });
  }
}

test("non-object bodies rejected", () => {
  for (const body of [undefined, null, [], "text"]) assert.ok(validateGroundReport(body).errors.body);
});

test("coordinate boundaries and zero are valid", () => {
  for (const [latitude, longitude] of [[-90, -180], [90, 180], [0, 0]]) {
    assert.deepEqual(validateGroundReport({ ...valid, latitude, longitude }).errors, {});
  }
});

test("supported disaster types and photo references are valid", () => {
  for (const disasterType of require("../src/modules/reports/report.constants").DISASTER_TYPES) {
    assert.deepEqual(validateGroundReport({ ...valid, disasterType }).errors, {});
  }
  for (const photo of [null, "https://example.com/photo.jpg", "/uploads/photo.jpg"]) {
    assert.deepEqual(validateGroundReport({ ...valid, photo }).errors, {});
  }
});

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

const server = app.listen(0, "127.0.0.1");
after(() => new Promise(resolve => server.close(resolve)));
async function request(path, body) {
  if (!server.listening) await once(server, "listening");
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", Authorization: 'Bearer test-token' },
    body: body === undefined ? undefined : body,
  });
  return { status: response.status, body: await response.json() };
}

test("health endpoint remains available", async () => {
  const response = await request("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
});

test("POST route creates a report with HTTP 201", async (t) => {
  t.mock.method(GroundReport, "create", async data => ({ ...data, _id: "test-report-id" }));
  const response = await request("/api/reports", JSON.stringify(valid));
  assert.equal(response.status, 201);
  assert.equal(response.body.data.status, "PENDING");
  assert.equal(response.body.data._id, "test-report-id");
  assert.equal(response.body.data.citizenId, authenticatedId);
});

test("invalid submission returns field errors and does not save", async (t) => {
  t.mock.method(GroundReport, "create", async () => { throw new Error("must not save"); });
  const response = await request("/api/reports", JSON.stringify({ ...valid, title: "" }));
  assert.equal(response.status, 400);
  assert.ok(response.body.errors.title);
  assert.equal(GroundReport.create.mock.callCount(), 0);
});

test("database failure returns safe HTTP 500", async (t) => {
  t.mock.method(GroundReport, "create", async () => { throw new Error("private database credentials"); });
  const response = await request("/api/reports", JSON.stringify(valid));
  assert.equal(response.status, 500);
  assert.equal(response.body.success, false);
  assert.ok(!JSON.stringify(response.body).includes("credentials"));
});

test("malformed JSON returns HTTP 400", async () => {
  assert.equal((await request("/api/reports", "{")).status, 400);
});

test("oversized request returns HTTP 413", async () => {
  assert.equal((await request("/api/reports", JSON.stringify({ ...valid, description: "x".repeat(110000) }))).status, 413);
});
