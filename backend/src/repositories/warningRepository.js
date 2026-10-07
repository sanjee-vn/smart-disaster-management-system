const Warning = require("../models/Warning");

const findAll = (filters = {}) => Warning.find(filters).sort({ createdAt: -1 }).limit(200).lean();
const findById = (warningId, session) => Warning.findOne({ warningId }).session(session || null).lean();
const create = (document, session) => Warning.create([document], { session }).then(([warning]) => warning.toObject());
const updateById = (warningId, update, session) => Warning.findOneAndUpdate(
  { warningId }, update, { new: true, runValidators: true, session },
).lean();
const queueRetry = (warningId, channel, occurredAt) => Warning.findOneAndUpdate(
  { warningId, status: "Published", "deliveryChannels.channel": channel },
  {
    $inc: { "deliveryChannels.$.retryCount": 1 },
    $set: { "deliveryChannels.$.lastRetryAt": occurredAt },
    $push: { audit: { type: "RETRY_QUEUED", channel, occurredAt, message: `Retry queued for ${channel}` } },
  },
  { new: true, runValidators: true },
).lean();
const hasPublishedForHazard = (hazardId, exceptWarningId, session) => Warning.exists({
  hazardId,
  status: "Published",
  warningId: { $ne: exceptWarningId },
}).session(session || null);

module.exports = { findAll, findById, create, updateById, queueRetry, hasPublishedForHazard };
