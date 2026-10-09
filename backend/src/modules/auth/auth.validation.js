function validateAuth(input, register = false) {
  const errors = {};
  const data = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { errors: { body: 'A JSON object is required.' }, data };
  if (register) {
    if (typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 100) errors.name = 'Enter your name, up to 100 characters.';
    else data.name = input.name.trim();
    if (input.role === 'STAFF_OFFICER') data.role = 'STAFF_OFFICER';
  }
  if (typeof input.email !== 'string' || input.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = 'Enter a valid email address.';
  else data.email = input.email.trim().toLowerCase();
  if (typeof input.password !== 'string' || input.password.length < 8 || Buffer.byteLength(input.password, 'utf8') > 72) errors.password = 'Use at least 8 characters and at most 72 UTF-8 bytes.';
  else data.password = input.password;
  return { errors, data };
}
module.exports = { validateAuth };
