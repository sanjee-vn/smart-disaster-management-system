const service = require('./auth.service');
const { validateAuth } = require('./auth.validation');
function failure(res, error) {
  const status = [401, 409].includes(error.status) ? error.status : 500;
  return res.status(status).json({ success: false, message: status === 500 ? 'Unable to complete your request. Please try again.' : error.message });
}
async function register(req, res) {
  const { data, errors } = validateAuth(req.body, true);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Check your registration details.', errors });
  try { return res.status(201).json({ success: true, message: 'Account created. Please log in.', data: { user: await service.register(data) } }); }
  catch (error) { return failure(res, error); }
}
async function login(req, res) {
  const { data, errors } = validateAuth(req.body);
  if (Object.keys(errors).length) return res.status(400).json({ success: false, message: 'Check your login details.', errors });
  try { return res.json({ success: true, data: await service.login(data) }); }
  catch (error) { return failure(res, error); }
}
function me(req, res) { return res.json({ success: true, data: { user: req.user } }); }
async function logout(req, res) {
  try { await service.logout(req.tokenId); return res.json({ success: true, message: 'Logged out.' }); }
  catch (error) { return failure(res, error); }
}
module.exports = { register, login, me, logout };
