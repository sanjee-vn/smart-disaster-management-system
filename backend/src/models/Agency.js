const mongoose = require("mongoose");

const agencySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  type: { type: String, required: true, enum: ["DMC", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL", "NGO", "VOLUNTEER"] },
  contact: { type: String, trim: true },
  status: { type: String, trim: true, default: "ACTIVE" },
}, { timestamps: true });

module.exports = mongoose.model("Agency", agencySchema);
