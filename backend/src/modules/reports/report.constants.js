const DISASTER_TYPES = Object.freeze([
  "Flood", "Landslide", "Storm", "Drought", "Fire", "Earthquake", "Other",
]);
const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_REFERENCE_LENGTH = 2048;

module.exports = { DISASTER_TYPES, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_REFERENCE_LENGTH };
