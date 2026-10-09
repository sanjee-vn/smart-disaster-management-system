const service = require("../services/resourceCoordinationService");

const listShelters = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getShelters(req.query) });
  } catch (error) { next(error); }
};

const getShelter = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getShelterById(req.params.id) });
  } catch (error) { next(error); }
};
const createShelter = async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.createShelter(req.body) }); } catch (error) { next(error); }
};

const listInventory = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getInventory(req.query) });
  } catch (error) { next(error); }
};

const listDeliveryResources = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getDeliveryResources(req.query) });
  } catch (error) { next(error); }
};

const getInventoryItem = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getInventoryItemById(req.params.id) });
  } catch (error) { next(error); }
};

const getDeliveryResource = async (req, res, next) => {
  try {
    res.json({ success: true, data: await service.getDeliveryResourceById(req.params.id) });
  } catch (error) { next(error); }
};

module.exports = { listShelters, createShelter, getShelter, listInventory, getInventoryItem, listDeliveryResources, getDeliveryResource };
