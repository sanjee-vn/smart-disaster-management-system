const distributionService = require("../services/distributionService");

const createDistribution = async (req, res, next) => {
  try {
    const distribution = await distributionService.createDistribution(req.body, {
      id: req.auth?.sub,
      name: req.user?.name,
    });
    res.status(201).json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
};

const listDistributions = async (req, res, next) => {
  try {
    const distributions = await distributionService.getDistributions(req.query);
    res.json({ success: true, data: distributions });
  } catch (error) {
    next(error);
  }
};

const markDelivered = async (req, res, next) => {
  try {
    const distribution = await distributionService.markDistributionDelivered(req.params.distributionId, req.body);
    res.json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
};

const accept = async (req, res, next) => {
  try {
    const distribution = await distributionService.acceptDistribution(req.params.distributionId, {
      id: req.auth?.sub,
      name: req.user?.name,
    });
    res.json({ success: true, data: distribution });
  } catch (error) {
    next(error);
  }
};

module.exports = { createDistribution, listDistributions, accept, markDelivered };
