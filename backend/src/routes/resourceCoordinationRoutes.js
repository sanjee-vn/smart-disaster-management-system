const express = require("express");
const controller = require("../controllers/resourceCoordinationController");
const distributionController = require("../controllers/distributionController");

const router = express.Router();
router.get("/shelters", controller.listShelters);
router.get("/distributions", distributionController.listDistributions);
router.get("/inventory", controller.listInventory);
router.get("/delivery-resources", controller.listDeliveryResources);
router.get("/inventory/:id", controller.getInventoryItem);
router.get("/delivery-resources/:id", controller.getDeliveryResource);
router.get("/shelters/:id", controller.getShelter);
router.post("/distributions", distributionController.createDistribution);

module.exports = router;
