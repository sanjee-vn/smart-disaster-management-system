const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const { validateAuthForm, passwordBytes } = require('../src/utils/authValidation.cjs');
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
