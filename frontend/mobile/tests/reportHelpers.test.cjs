const { test } = require('node:test');
const assert = require('node:assert/strict');
const { coordinatesLabel, formatDate, isReport, mergeReports, reportTimeline, statusInfo } = require('../src/utils/reports.cjs');
const report = { _id: 'report-1', title: 'Flood', description: 'Water rising.', disasterType: 'Flood', latitude: 0, longitude: 0, citizenId: 'test-citizen-001', status: 'PENDING', createdAt: '2026-10-08T05:00:00Z' };
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
