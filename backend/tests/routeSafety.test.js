const assert = require("node:assert/strict");
const { app } = require("../src/app");
const authRoutes = require("../src/modules/auth/auth.routes");
const reportRoutes = require("../src/modules/reports/report.routes");
const resourceCoordinationRoutes = require("../src/routes/resourceCoordinationRoutes");
const responseOperationsRoutes = require("../src/routes/responseOperationsRoutes");

const mountedRouters = [
  ["/api/auth", authRoutes],
  ["/api/reports", reportRoutes],
  ["/api/resource-coordination", resourceCoordinationRoutes],
  ["/api/response-operations", responseOperationsRoutes],
];
const writeMethods = ["post", "put", "patch", "delete"];
const routeWrites = (prefix, router) => router.stack.filter((layer) => layer.route).flatMap((layer) => Object.keys(layer.route.methods)
  .filter((method) => writeMethods.includes(method))
  .map((method) => `${method.toUpperCase()} ${prefix}${layer.route.path === "/" ? "" : layer.route.path}`));

const allowedWriteRoutes = [
  "POST /api/auth/register",
  "POST /api/auth/login",
  "POST /api/auth/logout",
  "POST /api/reports",
  "POST /api/resource-coordination/distributions",
  "PATCH /api/resource-coordination/distributions/:distributionId/deliver",
  "PATCH /api/response-operations/warnings/:warningId",
  "POST /api/response-operations/incidents/:incidentId/resolve",
  "POST /api/response-operations/assignments/dispatch",
  "POST /api/response-operations/operational-requests",
  "PATCH /api/response-operations/operational-requests/:requestId/review",
  "POST /api/response-operations/operational-requests/:requestId/dispatch",
].sort();

for (const [prefix, router] of mountedRouters) {
  assert.ok(app.router.stack.some((layer) => layer.handle === router), `${prefix} router is not mounted on the application`);
}
const writeRoutes = mountedRouters.flatMap(([prefix, router]) => routeWrites(prefix, router)).sort();
const allNestedWriteCount = app.router.stack.flatMap((layer) => layer.route ? [layer] : layer.handle?.stack || [])
  .filter((layer) => layer.route)
  .flatMap((layer) => Object.keys(layer.route.methods).filter((method) => writeMethods.includes(method))).length;

assert.equal(allNestedWriteCount, writeRoutes.length, "An unaccounted mounted mutation route is active");
assert.deepEqual(writeRoutes, allowedWriteRoutes, `Unexpected active write routes: ${writeRoutes.join(", ")}`);
console.log("Route safety passed: only the allowed auth, reports, warning, assignment, distribution, and resolution mutations are active.");
