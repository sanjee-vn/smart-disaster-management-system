const test = require('node:test');
const assert = require('node:assert/strict');
const { imageType } = require('../src/modules/reports/report.upload');
test('photo upload validates signatures rather than trusting filenames or MIME types', () => {
  assert.equal(imageType(Buffer.from([255, 216, 255, 224])), 'jpg');
  assert.equal(imageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'png');
  assert.equal(imageType(Buffer.from('RIFF0000WEBP')), 'webp');
  assert.equal(imageType(Buffer.from('<script>alert(1)</script>')), null);
  assert.equal(imageType(Buffer.alloc(0)), null);
});
