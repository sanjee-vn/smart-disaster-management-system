const { DISASTER_TYPES, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_REFERENCE_LENGTH } = require("./report.constants");

function validateGroundReport(input) {
  const errors = {};
  const data = {};
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { errors: { body: "A report object is required." }, data };
  }

  for (const [field, limit] of [["title", MAX_TITLE_LENGTH], ["description", MAX_DESCRIPTION_LENGTH], ["citizenId", 100]]) {
    if (typeof input[field] !== "string" || !input[field].trim()) {
      errors[field] = `${field} is required and must be text.`;
    } else if (input[field].trim().length > limit) {
      errors[field] = `${field} must be at most ${limit} characters.`;
    } else {
      data[field] = input[field].trim();
    }
  }

  if (!DISASTER_TYPES.includes(input.disasterType)) {
    errors.disasterType = `disasterType must be one of: ${DISASTER_TYPES.join(", ")}.`;
  } else {
    data.disasterType = input.disasterType;
  }

  for (const [field, limit] of [["latitude", 90], ["longitude", 180]]) {
    const value = input[field];
    if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > limit) {
      errors[field] = `${field} must be a number between -${limit} and ${limit}.`;
    } else {
      data[field] = value;
    }
  }

  data.photo = null;
  if (input.photo !== undefined && input.photo !== null) {
    if (typeof input.photo !== "string" || !input.photo.trim() || input.photo.length > MAX_REFERENCE_LENGTH || !/^(https?:\/\/|\/uploads\/)/i.test(input.photo.trim())) {
      errors.photo = "photo must be an HTTP(S) URL or /uploads/ path, or omitted.";
    } else {
      data.photo = input.photo.trim();
    }
  }
  return { errors, data };
}

module.exports = { validateGroundReport };
