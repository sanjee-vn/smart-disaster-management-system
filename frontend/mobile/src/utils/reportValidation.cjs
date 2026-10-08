const { DISASTERS } = require('./reports.cjs');
function isPhotoUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !!url.hostname; }
  catch { return false; }
}
function validateForm(form, location) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Enter a short report title.';
  else if (form.title.trim().length > 150) errors.title = 'Use at most 150 characters.';
  if (!form.description.trim()) errors.description = 'Describe what you observed.';
  else if (form.description.trim().length > 5000) errors.description = 'Use at most 5000 characters.';
  if (!DISASTERS[form.disasterType]) errors.disasterType = 'Select a disaster type.';
  if (!location || !Number.isFinite(location.latitude) || Math.abs(location.latitude) > 90 || !Number.isFinite(location.longitude) || Math.abs(location.longitude) > 180) errors.location = 'Attach your current location before submitting.';
  if (form.photo?.trim() && (!isPhotoUrl(form.photo.trim()) || form.photo.trim().length > 2048)) errors.photo = 'Enter a valid HTTP(S) photo URL, or leave this field empty.';
  return errors;
}
module.exports = { validateForm, isPhotoUrl };
