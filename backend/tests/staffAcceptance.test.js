const test = require('node:test');
const assert = require('node:assert/strict');
const Request = require('../src/models/OperationalRequest');
const repository = require('../src/repositories/operationalRequestRepository');
const service = require('../src/services/operationalRequestService');

test('staff acceptance records acknowledgment without marking delivery and is repeatable', async (t) => {
  const request = { _id: 'id', requestId: 'REQ-1', status: 'DISPATCHED', staffAcceptedAt: null };
  t.mock.method(Request, 'findOneAndUpdate', async (filter, update) => {
    assert.equal(filter.status, 'DISPATCHED');
    assert.equal(filter.staffAcceptedAt, null);
    assert.equal(update.$set.status, undefined);
    if (request.staffAcceptedAt) return null;
    request.staffAcceptedAt = update.$set.staffAcceptedAt;
    return request;
  });
  t.mock.method(repository, 'findByRequestId', async () => request);
  const accepted = await service.acceptByStaff('REQ-1');
  assert.ok(accepted.staffAcceptedAt);
  assert.equal(accepted.status, 'DISPATCHED');
  assert.equal(accepted.deliveredAt, null);
  assert.deepEqual(await service.acceptByStaff('REQ-1'), accepted);
});

test('staff cannot accept a request that has not been sent for dispatch', async (t) => {
  t.mock.method(Request, 'findOneAndUpdate', async () => null);
  t.mock.method(repository, 'findByRequestId', async () => ({ status: 'PENDING' }));
  await assert.rejects(service.acceptByStaff('REQ-2'), { code: 'REQUEST_NOT_ACCEPTABLE', status: 409 });
});
