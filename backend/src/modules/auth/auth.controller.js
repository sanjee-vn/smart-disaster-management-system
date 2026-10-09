const service = require('./auth.service');
const { validateAuth } = require('./auth.validation');
const operationalRequestService = require('../../services/operationalRequestService');
const responseOperationsService = require('../../services/responseOperationsService');
const distributionService = require('../../services/distributionService');
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
async function staffOperationalUpdates(req, res) {
  if (req.user.role !== 'STAFF_OFFICER') return res.status(403).json({ success: false, message: 'Staff Officer access is required.' });
  try {
    const [requests, incidents, assignments] = await Promise.all([
      operationalRequestService.list(),
      responseOperationsService.getIncidents(),
      responseOperationsService.getAssignments({}),
    ]);
    const distributions = (await Promise.all(incidents.map((incident) =>
      distributionService.getDistributions({ incidentId: incident.incidentId }).catch(() => []),
    ))).flat();
    return res.json({ success: true, data: { requests, incidents, assignments, distributions } });
  } catch {
    return res.status(500).json({ success: false, message: 'Unable to load operational updates. Please try again.' });
  }
}
module.exports = { register, login, me, logout, staffOperationalUpdates };
