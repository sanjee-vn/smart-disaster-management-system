const Shelter = require("../models/Shelter");

const findAll = () => Shelter.find().sort({ name: 1 }).lean();
const findById = (id) => Shelter.findById(id).lean();

module.exports = { findAll, findById };
