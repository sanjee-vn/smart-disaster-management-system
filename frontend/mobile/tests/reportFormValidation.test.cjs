const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateForm, isPhotoUrl } = require('../src/utils/reportValidation.cjs');
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
