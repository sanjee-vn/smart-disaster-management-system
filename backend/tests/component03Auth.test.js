const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const mobileAuth = require("../src/modules/auth/auth.service");
const staffAuth = require("../src/services/authService");
const requireComponent03Auth = require("../src/middleware/requireComponent03Auth");

const run = (token) => new Promise((resolve) => {
  const request = { get: () => `Bearer ${token}` };
  requireComponent03Auth(request, {}, (error) => resolve({ request, error }));
});

async function main() {
  const legacyToken = jwt.sign({ sub: "507f1f77bcf86cd799439011", role: "district_resource_officer" }, staffAuth.tokenSecret(), { expiresIn: "5m" });
  const legacy = await run(legacyToken);
  assert.equal(legacy.error, undefined);
  assert.equal(legacy.request.auth.role, "district_resource_officer");

  const original = mobileAuth.authenticate;
  mobileAuth.authenticate = async () => ({ user: { id: "507f1f77bcf86cd799439012", role: "STAFF_OFFICER" }, tokenId: "session-id" });
  try {
    const mobileToken = jwt.sign({}, staffAuth.tokenSecret(), {
      algorithm: "HS256",
      subject: "507f1f77bcf86cd799439012",
      issuer: "disaster-connect",
      audience: "disaster-connect-mobile",
      expiresIn: "5m",
    });
    const mobile = await run(mobileToken);
    assert.equal(mobile.error, undefined);
    assert.equal(mobile.request.auth.role, "staff_officer");
    assert.equal(mobile.request.tokenId, "session-id");

    mobileAuth.authenticate = async () => { throw Object.assign(new Error("Session expired"), { status: 401 }); };
    const expired = await run(mobileToken);
    assert.equal(expired.error.statusCode, 401);
    assert.equal(expired.error.code, "INVALID_SESSION");

    mobileAuth.authenticate = async () => { throw new Error("Database unavailable"); };
    const unavailable = await run(mobileToken);
    assert.equal(unavailable.error.statusCode, 503, "auth database failures must not be reported as expired sessions");
    assert.equal(unavailable.error.code, "AUTHENTICATION_UNAVAILABLE");
  } finally {
    mobileAuth.authenticate = original;
  }

  console.log("Component 03 auth tests passed: legacy web roles and read-only mobile Staff role are normalized.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
