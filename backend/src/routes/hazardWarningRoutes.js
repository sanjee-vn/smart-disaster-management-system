const express = require("express");
const controller = require("../controllers/hazardWarningController");
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.get("/auth/me", requireAuth, authController.currentUser);
router.use(requireAuth);
router.get("/hazards", controller.listHazards);
router.get("/hazards/:id", controller.getHazard);
router.patch("/hazards/:id", requireRole("duty_officer", "district_officer"), controller.updateHazard);
router.get("/hazards/:id/draft", controller.getDraft);
router.put("/hazards/:id/draft", requireRole("duty_officer"), controller.saveDraft);
router.get("/warnings", controller.listWarnings);
router.post("/warnings", requireRole("duty_officer"), controller.publishWarning);
router.get("/warnings/:id", controller.getWarning);
router.post("/warnings/:id/retries", requireRole("duty_officer"), controller.queueRetry);
router.post("/warnings/:id/escalations", requireRole("duty_officer"), controller.escalateWarning);
router.post("/warnings/:id/cancellation", requireRole("duty_officer"), controller.cancelWarning);

module.exports = router;
