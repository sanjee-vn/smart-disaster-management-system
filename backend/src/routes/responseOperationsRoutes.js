const express = require("express");
const controller = require("../controllers/responseOperationsController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
router.use(requireAuth);
router.get("/warnings/:warningId", controller.getWarning);
router.patch("/warnings/:warningId", requireRole("duty_officer"), controller.updateWarning);
router.get("/incidents", controller.listIncidents);
router.get("/incidents/:incidentId", controller.getIncident);
router.post("/incidents/:incidentId/resolve", controller.resolveResponse);
router.get("/agencies", controller.listAgencies);
router.get("/teams", controller.listTeams);
router.get("/assignments", controller.listAssignments);
router.post("/assignments/dispatch", requireRole("duty_officer"), controller.dispatchAssignment);

module.exports = router;
