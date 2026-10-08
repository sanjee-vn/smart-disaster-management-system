const { validateGroundReport } = require("./report.validation");
const reportService = require("./report.service");

async function submitGroundReport(req, res) {
  const input = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? { ...req.body, citizenId: req.user.id } : req.body;
  const { errors, data } = validateGroundReport(input);
  if (Object.keys(errors).length) {
    return res.status(400).json({ success: false, message: "Invalid ground report.", errors });
  }

  try {
    const report = await reportService.createGroundReport(data);
    return res.status(201).json({ success: true, message: "Ground report submitted successfully.", data: report });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to submit the report. Please try again." });
  }
}

async function listGroundReports(req, res, next) {
  try { return res.json({ success: true, data: await reportService.listReports(req.query) }); }
  catch (error) { return next(error); }
}

async function listMyGroundReports(req, res, next) {
  try { return res.json({ success: true, data: await reportService.listCitizenReports(req.user.id) }); }
  catch (error) { return next(error); }
}

async function reviewGroundReport(req, res, next) {
  try { return res.json({ success: true, data: await reportService.updateReportReview(req.params.id, req.body) }); }
  catch (error) { return next(error); }
}

async function listPublishedAlerts(_req, res, next) {
  try { return res.json({ success: true, data: await reportService.listPublishedAlerts() }); }
  catch (error) { return next(error); }
}

async function ensureReportHazard(req, res, next) {
  try { return res.json({ success: true, data: await reportService.ensureHazardForReport(req.params.id) }); }
  catch (error) { return next(error); }
}

module.exports = { submitGroundReport, listGroundReports, listMyGroundReports, reviewGroundReport, listPublishedAlerts, ensureReportHazard };
