const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createReportCache, CACHE_KEY } = require('../src/services/reportCache.cjs');
const report = { _id: 'report-1', title: 'Flood', description: 'Water rising.', disasterType: 'Flood', latitude: 0, longitude: 0, citizenId: 'test-citizen-001', status: 'PENDING', createdAt: '2026-10-08T05:00:00Z' };
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
