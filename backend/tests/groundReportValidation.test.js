const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateGroundReport } = require("../src/modules/reports/report.validation");
const valid = {
  title: "Flood near Galle Road", description: "Water level is rising.",
  disasterType: "Flood", latitude: 6.0329, longitude: 80.2168,
  citizenId: "test-citizen-001",
};

test("valid input is trimmed, optional photo defaults to null, protected fields excluded", () => {
  const { data, errors } = validateGroundReport({ ...valid, title: " Flood ", status: "APPROVED", createdAt: "fake" });
  assert.deepEqual(errors, {});
  assert.equal(data.title, "Flood");
  assert.equal(data.photo, null);
  assert.equal(data.status, undefined);
  assert.equal(data.createdAt, undefined);
});

for (const field of Object.keys(valid)) {
  test(`missing ${field} is rejected`, () => {
    const input = { ...valid };
    delete input[field];
    assert.ok(validateGroundReport(input).errors[field]);
  });
}

for (const [field, values] of Object.entries({
  title: [" ", 42, "x".repeat(151)],
  description: [" ", {}, "x".repeat(5001)],
  citizenId: [" ", 42, "x".repeat(101)],
  disasterType: ["Tsunami", null, {}],
  latitude: [-91, 91, "6", null, Infinity, NaN],
  longitude: [-181, 181, "80", null, Infinity, NaN],
  photo: [42, "", "data:image/png;base64,abc", "javascript:alert(1)", "https://example.com/" + "x".repeat(2048)],
})) {
  for (const [index, value] of values.entries()) {
    test(`invalid ${field} case ${index + 1}`, () => {
      assert.ok(validateGroundReport({ ...valid, [field]: value }).errors[field]);
    });
  }
}

test("non-object bodies rejected", () => {
  for (const body of [undefined, null, [], "text"]) assert.ok(validateGroundReport(body).errors.body);
});

test("coordinate boundaries and zero are valid", () => {
  for (const [latitude, longitude] of [[-90, -180], [90, 180], [0, 0]]) {
    assert.deepEqual(validateGroundReport({ ...valid, latitude, longitude }).errors, {});
  }
});

test("supported disaster types and photo references are valid", () => {
  for (const disasterType of require("../src/modules/reports/report.constants").DISASTER_TYPES) {
    assert.deepEqual(validateGroundReport({ ...valid, disasterType }).errors, {});
  }
  for (const photo of [null, "https://example.com/photo.jpg", "/uploads/photo.jpg"]) {
    assert.deepEqual(validateGroundReport({ ...valid, photo }).errors, {});
  }
});

