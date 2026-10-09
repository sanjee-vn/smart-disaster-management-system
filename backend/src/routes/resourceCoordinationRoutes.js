const express = require("express");
const controller = require("../controllers/resourceCoordinationController");
const distributionController = require("../controllers/distributionController");
const requireAuth = require("../middleware/requireComponent03Auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();
router.use(requireAuth);
router.use(requireRole("district_resource_officer", "response_officer", "duty_officer", "staff_officer"));
router.get("/shelters", controller.listShelters);
router.post("/shelters", requireRole("response_officer"), controller.createShelter);
router.get("/distributions", distributionController.listDistributions);
router.get("/inventory", controller.listInventory);
router.get("/delivery-resources", controller.listDeliveryResources);
router.get("/inventory/:id", controller.getInventoryItem);
router.get("/delivery-resources/:id", controller.getDeliveryResource);
router.get("/shelters/:id", controller.getShelter);
router.post("/distributions", requireRole("district_resource_officer"), distributionController.createDistribution);
router.patch("/distributions/:distributionId/accept", requireRole("staff_officer"), distributionController.accept);
router.patch("/distributions/:distributionId/deliver", requireRole("staff_officer"), distributionController.markDelivered);

module.exports = router;
