const express = require("express");
const controller = require("../controllers/responseOperationsController");

const router = express.Router();
router.get("/warnings/:warningId", controller.getWarning);
router.patch("/warnings/:warningId", controller.updateWarning);
router.get("/incidents", controller.listIncidents);
router.get("/incidents/:incidentId", controller.getIncident);
router.post("/incidents/:incidentId/resolve", controller.resolveResponse);
router.get("/agencies", controller.listAgencies);
router.get("/teams", controller.listTeams);
router.get("/assignments", controller.listAssignments);
router.post("/assignments/dispatch", controller.dispatchAssignment);

module.exports = router;
