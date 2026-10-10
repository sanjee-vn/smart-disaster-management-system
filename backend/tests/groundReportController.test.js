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
