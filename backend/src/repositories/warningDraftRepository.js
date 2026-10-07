const WarningDraft = require("../models/WarningDraft");

const findByHazardId = (hazardId) => WarningDraft.findOne({ hazardId }).lean();
const saveByHazardId = (hazardId, warning) => WarningDraft.findOneAndUpdate(
  { hazardId },
  { $set: { warning } },
  { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
).lean();

module.exports = { findByHazardId, saveByHazardId };
