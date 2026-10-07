const assert = require("node:assert/strict");
const { app } = require("../src/app");

const routeLayers = app.router.stack.flatMap((layer) => layer.handle?.stack || []).filter((layer) => layer.route);
const writeRoutes = routeLayers.flatMap((layer) => Object.keys(layer.route.methods)
  .filter((method) => ["post", "put", "patch", "delete"].includes(method))
  .map((method) => `${method.toUpperCase()} ${layer.route.path}`));

const allowedWriteRoutes = ["PATCH /warnings/:warningId", "POST /assignments/dispatch"];
assert.deepEqual(writeRoutes, allowedWriteRoutes, `Unexpected active write routes: ${writeRoutes.join(", ")}`);
console.log("Route safety passed: only the controlled Warning PATCH and assignment dispatch POST routes are active.");
