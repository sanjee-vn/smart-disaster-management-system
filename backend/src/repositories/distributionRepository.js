const Distribution = require("../models/Distribution");

const findByRequestId = (requestId) => Distribution.findOne({ requestId }).lean();
const create = async (data, session) => (await Distribution.create([data], { session }))[0];

module.exports = { findByRequestId, create };
