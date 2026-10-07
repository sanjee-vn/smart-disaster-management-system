const assert = require("node:assert/strict");
const { app } = require("../src/app");

const routeLayers = app.router.stack.flatMap((layer) => layer.handle?.stack || []).filter((layer) => layer.route);
const writeRoutes = routeLayers.flatMap((layer) => Object.keys(layer.route.methods)
  .filter((method) => ["post", "put", "patch", "delete"].includes(method))
  .map((method) => `${method.toUpperCase()} ${layer.route.path}`));

const allowedWriteRoutes = [
  "POST /register",
  "POST /login",
  "POST /logout",
  "POST /",
  "PATCH /warnings/:warningId",
  "POST /assignments/dispatch",
];
assert.deepEqual(writeRoutes, allowedWriteRoutes, `Unexpected active write routes: ${writeRoutes.join(", ")}`);
console.log("Route safety passed: only the allowed authentication, reporting, warning update, and assignment dispatch write routes are active.");
