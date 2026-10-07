const express = require("express");
const controller = require("../controllers/resourceCoordinationController");

const router = express.Router();
router.get("/shelters", controller.listShelters);
router.get("/inventory", controller.listInventory);
router.get("/delivery-resources", controller.listDeliveryResources);
router.get("/inventory/:id", controller.getInventoryItem);
router.get("/delivery-resources/:id", controller.getDeliveryResource);
router.get("/shelters/:id", controller.getShelter);

module.exports = router;
