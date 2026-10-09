const assert = require("node:assert/strict");
const app = require("../src/app");
const routers = [
  ["/api/auth", require("../src/modules/auth/auth.routes")],
  ["/api/staff/auth", require("../src/routes/staffAuthRoutes")],
  ["/api/reports", require("../src/modules/reports/report.routes")],
  ["/api", require("../src/routes/hazardWarningRoutes")],
  ["/api/resource-coordination", require("../src/routes/resourceCoordinationRoutes")],
  ["/api/response-operations", require("../src/routes/responseOperationsRoutes")],
];
const writeMethods = ["post", "put", "patch", "delete"];
const routesFor = (prefix, router) => router.stack.filter((layer) => layer.route).flatMap((layer) =>
  Object.keys(layer.route.methods)
    .filter((method) => writeMethods.includes(method))
    .map((method) => `${method.toUpperCase()} ${prefix}${layer.route.path === "/" ? "" : layer.route.path}`),
);
const expectedWrites = [
  "PATCH /api/hazards/:id",
  "PUT /api/hazards/:id/draft",
  "POST /api/warnings",
  "POST /api/warnings/:id/retries",
  "POST /api/warnings/:id/escalations",
  "POST /api/warnings/:id/cancellation",
  "POST /api/staff/auth/register",
  "POST /api/staff/auth/login",
  "POST /api/auth/register",
  "POST /api/auth/login",
  "POST /api/auth/logout",
  "POST /api/reports",
  "PATCH /api/reports/:id/review",
  "POST /api/reports/:id/hazard",
  "POST /api/resource-coordination/distributions",
  "POST /api/resource-coordination/shelters",
  "PATCH /api/resource-coordination/distributions/:distributionId/accept",
  "PATCH /api/resource-coordination/distributions/:distributionId/deliver",
  "PATCH /api/response-operations/warnings/:warningId",
  "PATCH /api/response-operations/teams/:teamId/availability",
  "POST /api/response-operations/incidents/:incidentId/resolve",
  "POST /api/response-operations/assignments/dispatch",
  "PATCH /api/response-operations/assignments/:responseId/accept",
  "POST /api/response-operations/operational-requests",
  "PATCH /api/response-operations/operational-requests/:requestId/review",
  "POST /api/response-operations/operational-requests/:requestId/dispatch",
  "POST /api/response-operations/operational-requests/:requestId/deliver",
].sort();

for (const [prefix, router] of routers) {
  assert.ok(app.router.stack.some((layer) => layer.handle === router), `${prefix} router is not mounted on the application`);
}
const actualWrites = routers.flatMap(([prefix, router]) => routesFor(prefix, router)).sort();
const hazardRouter = routers.find(([prefix]) => prefix === "/api")[1];
const hazardAuthLayers = hazardRouter.stack.filter((layer) => !layer.route);
assert.ok(hazardAuthLayers.some((layer) => layer.match("/hazards/INC-001")), "hazard API must remain protected");
assert.ok(hazardAuthLayers.some((layer) => layer.match("/warnings/WRN-001")), "warning API must remain protected");
assert.ok(!hazardAuthLayers.some((layer) => layer.match("/resource-coordination/distributions/DST-001/accept")), "hazard auth must not intercept delivery acceptance");
assert.ok(!hazardAuthLayers.some((layer) => layer.match("/response-operations/assignments/RSP-001/accept")), "hazard auth must not intercept dispatch acceptance");
const appWriteCount = app.router.stack.flatMap((layer) => layer.route ? [layer] : layer.handle?.stack || [])
  .filter((layer) => layer.route)
  .flatMap((layer) => Object.keys(layer.route.methods).filter((method) => writeMethods.includes(method))).length;

assert.equal(appWriteCount, actualWrites.length, "An unaccounted mounted mutation route is active");
assert.deepEqual(actualWrites, expectedWrites, `Unexpected active write routes: ${actualWrites.join(", ")}`);
console.log("Route safety passed: only reviewed citizen, staff, hazard, resource, warning, and response writes are active.");
