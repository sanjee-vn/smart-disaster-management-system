const test = require('node:test');
const assert = require('node:assert/strict');
const Warning = require('../src/models/Warning');
const Hazard = require('../src/models/Hazard');
const GroundReport = require('../src/modules/reports/report.model');
const { listPublishedAlerts } = require('../src/modules/reports/report.service');

test('alert map uses report coordinates, falls back to hazard coordinates, and leaves unknown locations unset', async (t) => {
  const warnings = [
    { warningId: 'report', sourceReportId: 'r1', hazardId: 'h1' },
    { warningId: 'hazard', hazardId: 'h2' },
    { warningId: 'unknown', hazardId: 'h3' },
    { warningId: 'invalid', hazardId: 'h4' },
  ];
  t.mock.method(Warning, 'find', () => ({ sort: () => ({ limit: () => ({ lean: async () => warnings }) }) }));
  t.mock.method(GroundReport, 'find', () => ({ lean: async () => [{ _id: 'r1', latitude: 0, longitude: 80 }] }));
  t.mock.method(Hazard, 'find', () => ({ lean: async () => [
    { hazardId: 'h1', location: '7 N, 81 E' },
    { hazardId: 'h2', location: '6.5 S, 79.2 W' },
    { hazardId: 'h3', location: 'Unknown' },
    { hazardId: 'h4', location: '100 N, 200 E' },
  ] }));
  const alerts = await listPublishedAlerts();
  assert.deepEqual(alerts.map(({ latitude, longitude }) => [latitude, longitude]), [[0, 80], [-6.5, -79.2], [null, null], [null, null]]);
});
