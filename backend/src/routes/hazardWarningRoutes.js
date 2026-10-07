const express = require("express");
const controller = require("../controllers/hazardWarningController");

const router = express.Router();
router.get("/hazards", controller.listHazards);
router.get("/hazards/:id", controller.getHazard);
router.patch("/hazards/:id", controller.updateHazard);
router.get("/hazards/:id/draft", controller.getDraft);
router.put("/hazards/:id/draft", controller.saveDraft);
router.get("/warnings", controller.listWarnings);
router.post("/warnings", controller.publishWarning);
router.get("/warnings/:id", controller.getWarning);
router.post("/warnings/:id/retries", controller.queueRetry);
router.post("/warnings/:id/escalations", controller.escalateWarning);
router.post("/warnings/:id/cancellation", controller.cancelWarning);

module.exports = router;
