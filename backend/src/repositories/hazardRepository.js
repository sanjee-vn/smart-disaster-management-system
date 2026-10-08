const Hazard = require("../models/Hazard");

const findAll = (filters = {}) => Hazard.find(filters).sort({ updatedAt: -1, hazardId: 1 }).limit(200).lean();
const findById = (hazardId, session) => Hazard.findOne({ hazardId }).session(session || null).lean();
const updateById = (hazardId, update, session) => Hazard.findOneAndUpdate(
  { hazardId }, { $set: update }, { new: true, runValidators: true, session },
).lean();

module.exports = { findAll, findById, updateById };
