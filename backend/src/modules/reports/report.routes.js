const router = require("express").Router();
const { submitGroundReport, listGroundReports, listMyGroundReports, reviewGroundReport, listPublishedAlerts, ensureReportHazard } = require("./report.controller");
const requireCitizenAuth = require('../../middleware/auth');
const requireStaffAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');

router.post("/", requireCitizenAuth, submitGroundReport);
router.post("/photo", requireCitizenAuth, require('./report.upload').uploadPhoto);
router.get("/alerts", requireCitizenAuth, listPublishedAlerts);
router.get("/mine", requireCitizenAuth, listMyGroundReports);
router.get("/", requireStaffAuth, requireRole("dmc_officer", "duty_officer"), listGroundReports);
router.patch("/:id/review", requireStaffAuth, requireRole("dmc_officer"), reviewGroundReport);
router.post("/:id/hazard", requireStaffAuth, requireRole("duty_officer"), ensureReportHazard);

module.exports = router;
