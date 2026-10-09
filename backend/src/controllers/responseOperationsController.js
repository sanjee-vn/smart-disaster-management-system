const service = require("../services/responseOperationsService");

const getWarning = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getWarning(req.params.warningId) }); } catch (error) { next(error); }
};
const updateWarning = async (req, res, next) => {
  try { res.json({ success: true, data: await service.updateWarning(req.params.warningId, req.body) }); } catch (error) { next(error); }
};
const listIncidents = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getIncidents() }); } catch (error) { next(error); }
};
const getIncident = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getIncident(req.params.incidentId) }); } catch (error) { next(error); }
};
const listAgencies = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getAgencies(req.query) }); } catch (error) { next(error); }
};
const listTeams = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getTeams(req.query) }); } catch (error) { next(error); }
};
const markTeamAvailable = async (req, res, next) => {
  try { res.json({ success: true, data: await service.markTeamAvailable(req.params.teamId) }); } catch (error) { next(error); }
};
const listAssignments = async (req, res, next) => {
  try { res.json({ success: true, data: await service.getAssignments(req.query) }); } catch (error) { next(error); }
};
const dispatchAssignment = async (req, res, next) => {
  try { res.json({ success: true, data: await service.dispatchResponseAssignment(req.body) }); } catch (error) { next(error); }
};
const acceptAssignment = async (req, res, next) => {
  try { res.json({ success: true, data: await service.acceptResponseAssignmentByStaff(req.params.responseId, { id: req.user?.id, name: req.user?.name }) }); } catch (error) { next(error); }
};
const resolveResponse = async (req, res, next) => {
  try { res.json({ success: true, data: await service.resolveResponse(req.params.incidentId) }); } catch (error) { next(error); }
};

module.exports = { getWarning, updateWarning, listIncidents, getIncident, listAgencies, listTeams, markTeamAvailable, listAssignments, dispatchAssignment, acceptAssignment, resolveResponse };
