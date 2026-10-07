const router = require("express").Router();
const { submitGroundReport } = require("./report.controller");
const requireAuth = require('../../middleware/auth');

router.post("/", requireAuth, submitGroundReport);

module.exports = router;
