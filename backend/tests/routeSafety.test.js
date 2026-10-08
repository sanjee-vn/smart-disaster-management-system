const assert = require("node:assert/strict");
const { app } = require("../src/app");

const routeLayers = app.router.stack.flatMap((layer) => layer.handle?.stack || []).filter((layer) => layer.route);
const writeRoutes = routeLayers.flatMap((layer) => Object.keys(layer.route.methods)
  .filter((method) => ["post", "put", "patch", "delete"].includes(method))
  .map((method) => `${method.toUpperCase()} ${layer.route.path}`));

const allowedWriteRoutes = [
  "POST /auth/register",
  "POST /auth/login",
  "PATCH /hazards/:id",
  "PUT /hazards/:id/draft",
  "POST /warnings",
  "POST /warnings/:id/retries",
  "POST /warnings/:id/escalations",
  "POST /warnings/:id/cancellation",
  "PATCH /warnings/:warningId",
  "POST /assignments/dispatch",
];
assert.deepEqual(writeRoutes, allowedWriteRoutes, `Unexpected active write routes: ${writeRoutes.join(", ")}`);
console.log("Route safety passed: only explicitly reviewed hazard, warning, and assignment write routes are active.");
