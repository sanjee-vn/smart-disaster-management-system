const { test } = require('node:test');
const assert = require('node:assert/strict');
const { coordinatesLabel, formatDate, isReport, mergeReports, reportTimeline, statusInfo } = require('../src/utils/reports.cjs');
const { validateForm, isPhotoUrl } = require('../src/utils/reportValidation.cjs');
const { createReportCache, CACHE_KEY } = require('../src/services/reportCache.cjs');
const { validateAuthForm, passwordBytes } = require('../src/utils/authValidation.cjs');
const report = { _id: 'report-1', title: 'Flood', description: 'Water rising.', disasterType: 'Flood', latitude: 0, longitude: 0, citizenId: 'test-citizen-001', status: 'PENDING', createdAt: '2026-10-08T05:00:00Z' };
const form = { title: report.title, description: report.description, disasterType: report.disasterType, photo: '' };

test('valid report form accepts zero coordinates and no photo', () => {
  assert.deepEqual(validateForm(form, report), {});
  assert.deepEqual(validateForm({ ...form, photo: 'https://example.com/photo.jpg' }, report), {});
});
for (const field of ['title', 'description', 'disasterType']) {
  test(`form requires ${field}`, () => assert.ok(validateForm({ ...form, [field]: '' }, report)[field]));
}
test('form rejects overly long text, invalid types and photo references', () => {
  assert.ok(validateForm({ ...form, title: 'x'.repeat(151) }, report).title);
  assert.ok(validateForm({ ...form, description: 'x'.repeat(5001) }, report).description);
  assert.ok(validateForm({ ...form, disasterType: 'Invalid' }, report).disasterType);
  for (const photo of ['file:///local.jpg', 'javascript:alert(1)', 'https://example.com/' + 'x'.repeat(2048)]) assert.ok(validateForm({ ...form, photo }, report).photo);
});
test('form rejects missing and invalid location but accepts boundaries', () => {
  for (const location of [null, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: -181 }, { latitude: NaN, longitude: 0 }, { latitude: '0', longitude: 0 }]) assert.ok(validateForm(form, location).location);
  assert.deepEqual(validateForm(form, { latitude: -90, longitude: 180 }), {});
});
test('photo URL checks reject malformed or unsupported references', () => {
  assert.equal(isPhotoUrl('https://example.com/p.png'), true);
  assert.equal(isPhotoUrl('http://example.com/p.png'), true);
  for (const url of ['', 'not-a-url', 'https://', 'ftp://example.com/p.png', 'data:image/png;base64,test']) assert.equal(isPhotoUrl(url), false);
});
test('report merging deduplicates, updates status and sorts newest first', () => {
  const result = mergeReports([report], [{ ...report, status: 'VERIFIED' }, { ...report, _id: 'report-2', createdAt: '2026-10-09T00:00:00Z' }]);
  assert.equal(result.length, 2);
  assert.equal(result[0]._id, 'report-2');
  assert.equal(result[1].status, 'VERIFIED');
});
test('invalid cached records are excluded', () => {
  for (const item of [null, {}, { ...report, latitude: 100 }, { ...report, longitude: 181 }, { ...report, disasterType: 'Invalid' }, { ...report, citizenId: undefined }]) assert.ok(!isReport(item));
  assert.deepEqual(mergeReports([null, {}], [report]), [report]);
  assert.deepEqual(mergeReports([], [{ ...report, createdAt: null }, { ...report, _id: 'r2', createdAt: null }]).length, 2);
});
test('formatting uses actual coordinates and handles missing values', () => {
  assert.equal(coordinatesLabel(report), '0.00000, 0.00000');
  assert.equal(coordinatesLabel({}), 'Location unavailable');
  assert.equal(formatDate(undefined), 'Date unavailable');
  assert.equal(formatDate('not-a-date'), 'Date unavailable');
  assert.match(formatDate(report.createdAt), /2026/);
  assert.match(formatDate(report.createdAt), /10:30/);
});
test('timeline does not invent verification or response progress', () => {
  assert.deepEqual(reportTimeline(report).map(item => item.complete), [true, false, false, false]);
  assert.deepEqual(reportTimeline({ ...report, status: 'VERIFIED' }).map(item => item.complete), [true, true, false, false]);
  assert.deepEqual(reportTimeline({ ...report, status: 'RESPONSE_INITIATED' }).map(item => item.complete), [true, true, true, false]);
  assert.deepEqual(reportTimeline({ ...report, status: 'RESOLVED' }).map(item => item.complete), [true, true, true, true]);
  assert.equal(reportTimeline({ ...report, status: 'REJECTED' })[1].title, 'Report rejected');
  assert.equal(reportTimeline({ ...report, status: 'UNKNOWN' })[1].complete, false);
  assert.equal(statusInfo('UNKNOWN').label, 'Status unavailable');
  assert.equal(statusInfo('PENDING').label, 'Pending verification');
});
function memoryStorage(initial) {
  let value = initial ?? null;
  return { getItem: async key => { assert.equal(key, CACHE_KEY); return value; }, setItem: async (key, text) => { assert.equal(key, CACHE_KEY); value = text; } };
}
test('cache saves actual API receipts and reloads after restart', async () => {
  const storage = memoryStorage();
  const cache = createReportCache(storage);
  assert.deepEqual(await cache.load(), []);
  await cache.save(report);
  assert.deepEqual(await createReportCache(storage).load(), [report]);
});
test('concurrent receipt saves preserve both submissions', async () => {
  const cache = createReportCache(memoryStorage());
  await Promise.all([cache.save(report), cache.save({ ...report, _id: 'report-2' })]);
  assert.equal((await cache.load()).length, 2);
});
test('malformed storage and device read failures surface to caller', async () => {
  await assert.rejects(createReportCache(memoryStorage('{')).load());
  await assert.rejects(createReportCache(memoryStorage('{}')).load(), /Invalid report cache/);
  await assert.rejects(createReportCache({ getItem: async () => { throw new Error('read failed'); } }).load(), /read failed/);
});
test('failed write does not prevent a later successful save', async () => {
  const storage = memoryStorage();
  const write = storage.setItem;
  let first = true;
  storage.setItem = async (...args) => { if (first) { first = false; throw new Error('disk full'); } return write(...args); };
  const cache = createReportCache(storage);
  await assert.rejects(cache.save(report), /disk full/);
  await cache.save(report);
  assert.equal((await cache.load()).length, 1);
});

test('different accounts have separate caches and do not load or save other users reports', async () => {
  const values = new Map();
  const storage = { getItem: async key => values.get(key) || null, setItem: async (key, text) => values.set(key, text) };
  const first = createReportCache(storage, 'citizen-one');
  const second = createReportCache(storage, 'citizen-two');
  await first.save({ ...report, citizenId: 'citizen-one' });
  assert.equal((await first.load()).length, 1);
  assert.equal((await second.load()).length, 0);
  await first.save({ ...report, citizenId: 'citizen-two', _id: 'wrong-owner' });
  assert.equal((await first.load()).length, 1);
  values.set(`${CACHE_KEY}:citizen-two`, JSON.stringify([{ ...report, citizenId: 'citizen-one' }]));
  assert.deepEqual(await second.load(), []);
});
const authForm = { name: 'Citizen', email: 'user@example.com', password: 'password-123', confirmPassword: 'password-123' };
test('mobile registration and login validate valid data', () => {
  assert.deepEqual(validateAuthForm(authForm, true), {});
  assert.deepEqual(validateAuthForm({ email: authForm.email, password: authForm.password }), {});
});
test('mobile auth catches invalid names, email, passwords and confirmation mismatch', () => {
  for (const name of ['', ' ', 'x'.repeat(101)]) assert.ok(validateAuthForm({ ...authForm, name }, true).name);
  for (const email of ['', 'bad', 'x'.repeat(255) + '@test.com']) assert.ok(validateAuthForm({ ...authForm, email }).email);
  for (const password of ['', 'short', 'x'.repeat(73), '🙂'.repeat(19)]) assert.ok(validateAuthForm({ ...authForm, password }).password);
  assert.ok(validateAuthForm({ ...authForm, confirmPassword: 'different' }, true).confirmPassword);
});
test('password byte counts match UTF-8 across scripts and emoji', () => {
  for (const value of ['ascii-text', 'é', 'தமிழ்', 'සිංහල', '🙂']) assert.equal(passwordBytes(value), Buffer.byteLength(value));
  assert.deepEqual(validateAuthForm({ ...authForm, password: '🙂'.repeat(18) }), {});
});
