const mongoose = require("mongoose");

const hazardSchema = new mongoose.Schema({
  hazardId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  type: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true, index: true },
  severity: { type: String, required: true, enum: ["Low", "Medium", "High"] },
  status: { type: String, required: true, enum: ["Monitoring", "Active", "Warning Issued", "Pending"], default: "Monitoring", index: true },
  population: { type: String, required: true, trim: true },
  confidence: { type: String, required: true, enum: ["Low", "Medium", "High"] },
  description: { type: String, required: true, trim: true, maxlength: 1500 },
  source: { type: String, required: true, trim: true },
  ds: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  reportedAt: { type: Date, default: Date.now },
}, { timestamps: true, versionKey: false });

hazardSchema.index({ status: 1, severity: -1, updatedAt: -1 });

module.exports = mongoose.model("Hazard", hazardSchema);
