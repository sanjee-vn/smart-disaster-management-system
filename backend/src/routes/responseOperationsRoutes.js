const express = require("express");
const controller = require("../controllers/responseOperationsController");
const requestController = require("../controllers/operationalRequestController");
const requireAuth = require("../middleware/requireComponent03Auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("duty_officer", "response_officer", "district_resource_officer", "staff_officer"));
router.get("/warnings/:warningId", controller.getWarning);
router.patch("/warnings/:warningId", requireRole("duty_officer", "response_officer"), controller.updateWarning);
router.get("/incidents", controller.listIncidents);
router.get("/incidents/:incidentId", controller.getIncident);
router.post("/incidents/:incidentId/resolve", requireRole("response_officer"), controller.resolveResponse);
router.get("/agencies", controller.listAgencies);
router.get("/teams", controller.listTeams);
router.patch("/teams/:teamId/availability", requireRole("district_resource_officer"), controller.markTeamAvailable);
router.get("/assignments", controller.listAssignments);
router.post("/assignments/dispatch", requireRole("duty_officer", "response_officer"), controller.dispatchAssignment);
router.patch("/assignments/:responseId/accept", requireRole("staff_officer"), controller.acceptAssignment);
router.get("/operational-requests", requestController.list);
router.post("/operational-requests", requireRole("response_officer"), requestController.create);
router.patch("/operational-requests/:requestId/review", requireRole("duty_officer", "district_resource_officer"), requestController.review);
router.post("/operational-requests/:requestId/dispatch", requireRole("response_officer"), requestController.dispatch);
router.post("/operational-requests/:requestId/accept", requireRole("staff_officer"), requestController.acceptByStaff);
router.post("/operational-requests/:requestId/deliver", requireRole("staff_officer"), requestController.deliverByStaff);

module.exports = router;
