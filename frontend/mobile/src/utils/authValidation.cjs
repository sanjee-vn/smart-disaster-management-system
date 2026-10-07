function passwordBytes(value) {
  return Array.from(value).reduce((total, char) => { const point = char.codePointAt(0); return total + (point <= 0x7F ? 1 : point <= 0x7FF ? 2 : point <= 0xFFFF ? 3 : 4); }, 0);
}
function validateAuthForm(form, register = false) {
  const errors = {};
  if (register && (!form.name?.trim() || form.name.trim().length > 100)) errors.name = 'Enter your name, up to 100 characters.';
  if (!form.email?.trim() || form.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  if (!form.password || form.password.length < 8 || passwordBytes(form.password) > 72) errors.password = 'Use at least 8 characters (maximum 72 UTF-8 bytes).';
  if (register && form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}
module.exports = { validateAuthForm, passwordBytes };
