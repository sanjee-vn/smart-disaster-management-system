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

module.exports = { submitGroundReport };
