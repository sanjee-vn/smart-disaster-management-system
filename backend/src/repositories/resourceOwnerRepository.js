const ResourceOwner = require("../models/ResourceOwner");

const findByIdInSession = (id, session) => ResourceOwner.findById(id).session(session);

module.exports = { findByIdInSession };
