const mongoose = require("mongoose");

const warningSchema = new mongoose.Schema({
  warningId: { type: String, required: true, unique: true, trim: true, index: true },
  hazardType: { type: String, required: true, trim: true },
  severity: { type: String, required: true, enum: ["WATCH", "WARNING", "EMERGENCY"] },
  targetArea: { type: String, required: true, trim: true },
  message: { type: String, trim: true },
  district: { type: String, required: true, trim: true },
  status: { type: String, required: true, enum: ["DRAFT", "ACTIVE", "UPDATED", "EXPIRED"] },
  issuedBy: { type: String, trim: true },
  issuedAt: Date,
  updatedAt: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Warning", warningSchema);
