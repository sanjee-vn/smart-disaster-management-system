const express = require("express");
const controller = require("../controllers/responseOperationsController");
const requestController = require("../controllers/operationalRequestController");

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
router.get("/operational-requests", requestController.list);
router.post("/operational-requests", requestController.create);
router.patch("/operational-requests/:requestId/review", requestController.review);
router.post("/operational-requests/:requestId/dispatch", requestController.dispatch);

module.exports = router;
