const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validateAuth } = require('../src/modules/auth/auth.validation');
const User = require('../src/modules/auth/auth.model');
const Session = require('../src/modules/auth/auth.session');
const service = require('../src/modules/auth/auth.service');
const reportService = require('../src/modules/reports/report.service');
const app = require('../src/app');
process.env.JWT_SECRET = 'test-only-secret-for-auth-unit-tests-0123456789';
const valid = { name: 'Test Citizen', email: 'citizen@example.com', password: 'test-pass-123' };
const id = '507f1f77bcf86cd799439011';

test('registration trims names and normalizes emails without altering passwords or accepting roles', () => {
  const { data, errors } = validateAuth({ ...valid, name: ' Test Citizen ', email: ' CITIZEN@EXAMPLE.COM ', role: 'ADMIN' }, true);
  assert.deepEqual(errors, {});
  assert.equal(data.name, 'Test Citizen'); assert.equal(data.email, valid.email); assert.equal(data.password, valid.password); assert.equal(data.role, undefined);
  assert.deepEqual(validateAuth(valid).errors, {});
});
test('auth rejects non-object bodies', () => {
  for (const input of [null, undefined, [], 'text']) assert.ok(validateAuth(input).errors.body);
});
for (const [field, values] of Object.entries({ name: ['', ' ', 42, 'x'.repeat(101)], email: ['', 'bad', {}, 'x'.repeat(255) + '@test.com'], password: ['', 'short', 42, 'x'.repeat(73), '🙂'.repeat(19)] })) {
  for (const [index, value] of values.entries()) test(`invalid auth ${field} ${index}`, () => assert.ok(validateAuth({ ...valid, [field]: value }, true).errors[field]));
}
test('password boundary uses UTF-8 bytes', () => {
  assert.deepEqual(validateAuth({ ...valid, password: '🙂'.repeat(18) }, true).errors, {});
  assert.deepEqual(validateAuth({ ...valid, password: 'x'.repeat(72) }).errors, {});
});
test('user model requires fields and protects password hashes', async () => {
  await assert.rejects(new User({}).validate());
  const user = new User({ name: valid.name, email: valid.email, passwordHash: 'hashed' });
  await user.validate(); assert.equal(user.role, 'CITIZEN'); assert.equal(User.schema.path('passwordHash').options.select, false);
  assert.deepEqual(User.schema.path('role').enumValues, ['CITIZEN', 'RESPONSE_OPERATIONS_OFFICER', 'DISTRICT_RESOURCE_COORDINATION_OFFICER', 'STAFF_OFFICER']);
  assert.equal(User.schema.path('email').options.unique, true);
  assert.equal(Session.schema.path('expiresAt').options.index.expires, 0);
});
test('missing or short JWT configuration fails closed', () => {
  const secret = process.env.JWT_SECRET;
  try { delete process.env.JWT_SECRET; assert.throws(service.assertAuthConfig); process.env.JWT_SECRET = 'short'; assert.throws(service.assertAuthConfig); }
  finally { process.env.JWT_SECRET = secret; }
  service.assertAuthConfig();
});

const server = app.listen(0, '127.0.0.1');
after(() => new Promise(resolve => server.close(resolve)));
async function request(path, body, token, method) {
  if (!server.listening) await once(server, 'listening');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: method || (body === undefined ? 'GET' : 'POST'), headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
test('register → login → me → owned report → logout revokes token', async t => {
  let user; const sessions = new Map();
  t.mock.method(User, 'create', async data => { user = { ...data, _id: id, createdAt: new Date() }; return user; });
  t.mock.method(User, 'findOne', () => ({ select: async () => user }));
  t.mock.method(User, 'findById', async () => user);
  t.mock.method(Session, 'create', async session => { sessions.set(session.tokenId, session); return session; });
  t.mock.method(Session, 'findOne', async filter => sessions.get(filter.tokenId) || null);
  t.mock.method(Session, 'deleteOne', async filter => { sessions.delete(filter.tokenId); });
  t.mock.method(reportService, 'createGroundReport', async data => ({ ...data, _id: 'report-id', status: 'PENDING' }));

  const registered = await request('/api/auth/register', { ...valid, role: 'ADMIN' });
  assert.equal(registered.status, 201); assert.equal(registered.body.data.user.role, 'CITIZEN');
  assert.equal(registered.body.data.user.passwordHash, undefined); assert.equal(registered.body.data.token, undefined);
  assert.notEqual(user.passwordHash, valid.password); assert.ok(await bcrypt.compare(valid.password, user.passwordHash));
  const loggedIn = await request('/api/auth/login', { email: valid.email, password: valid.password });
  assert.equal(loggedIn.status, 200);
  const token = loggedIn.body.data.token;
  assert.ok(token); assert.equal(loggedIn.body.data.user.passwordHash, undefined);
  assert.equal(jwt.verify(token, process.env.JWT_SECRET).sub, id);
  assert.equal((await request('/api/auth/me', undefined, token)).body.data.user.id, id);
  const report = await request('/api/reports', { title: 'Flood', description: 'Water rising', disasterType: 'Flood', latitude: 0, longitude: 0, citizenId: 'someone-else' }, token);
  assert.equal(report.status, 201); assert.equal(report.body.data.citizenId, id);
  assert.equal((await request('/api/auth/logout', {}, token)).status, 200);
  assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
  assert.equal((await request('/api/reports', {}, token)).status, 401);
});
test('protected routes reject missing and malformed authorization', async () => {
  assert.equal((await request('/api/auth/me')).status, 401);
  assert.equal((await request('/api/reports', {})).status, 401);
  assert.equal((await request('/api/auth/me', undefined, 'invalid-token')).status, 401);
});
test('expired or wrong-audience tokens are rejected before database access', async () => {
  for (const options of [{ expiresIn: -1, audience: 'disaster-connect-mobile' }, { expiresIn: 60, audience: 'wrong' }]) {
    const token = jwt.sign({}, process.env.JWT_SECRET, { subject: id, jwtid: 'session', issuer: 'disaster-connect', ...options });
    assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
  }
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: 'not-an-id', jwtid: 'session', issuer: 'disaster-connect', audience: 'disaster-connect-mobile' });
  assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
});
test('missing users and wrong passwords get the same safe login response', async t => {
  t.mock.method(User, 'findOne', () => ({ select: async () => null }));
  const missing = await request('/api/auth/login', valid);
  assert.equal(missing.status, 401);
  t.mock.method(User, 'findOne', () => ({ select: async () => ({ _id: id, passwordHash: await bcrypt.hash('other-password', 4) }) }));
  const wrong = await request('/api/auth/login', valid);
  assert.equal(wrong.status, 401); assert.equal(wrong.body.message, missing.body.message);
});
test('duplicate account and database failures return safe responses', async t => {
  t.mock.method(User, 'create', async () => { throw Object.assign(new Error('private DB details'), { code: 11000 }); });
  assert.equal((await request('/api/auth/register', valid)).status, 409);
  t.mock.method(User, 'create', async () => { throw new Error('private DB details'); });
  const response = await request('/api/auth/register', valid);
  assert.equal(response.status, 500); assert.ok(!JSON.stringify(response.body).includes('private'));
});
test('registration and login return validation errors', async () => {
  assert.equal((await request('/api/auth/register', {})).status, 400);
  assert.equal((await request('/api/auth/login', {})).status, 400);
});
test('unavailable database during authentication returns 503 rather than 401', async t => {
  t.mock.method(Session, 'findOne', async () => { throw new Error('DB failure'); });
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: id, jwtid: 'session', issuer: 'disaster-connect', audience: 'disaster-connect-mobile', expiresIn: 60 });
  assert.equal((await request('/api/auth/me', undefined, token)).status, 503);
});
test('session with a deleted account cannot authenticate', async t => {
  t.mock.method(Session, 'findOne', async () => ({})); t.mock.method(User, 'findById', async () => null);
  const token = jwt.sign({}, process.env.JWT_SECRET, { subject: id, jwtid: 'session', issuer: 'disaster-connect', audience: 'disaster-connect-mobile', expiresIn: 60 });
  assert.equal((await request('/api/auth/me', undefined, token)).status, 401);
});
test('logout database failure returns safe HTTP 500', async t => {
  t.mock.method(service, 'authenticate', async () => ({ user: { id }, tokenId: 'session' }));
  t.mock.method(Session, 'deleteOne', async () => { throw new Error('private DB failure'); });
  assert.equal((await request('/api/auth/logout', {}, 'token')).status, 500);
});
test('repeated failed authentication attempts are rate limited', async () => {
  let result;
  for (let index = 0; index < 21; index++) result = await request('/api/auth/login', {});
  assert.equal(result.status, 429);
  assert.match(result.body.message, /Too many attempts/);
});
