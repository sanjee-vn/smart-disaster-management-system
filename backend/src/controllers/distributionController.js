const distributionService = require("../services/distributionService");

const createDistribution = async (req, res, next) => {
  try {
    const distribution = await distributionService.createDistribution(req.body);
    res.status(201).json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDistribution };
