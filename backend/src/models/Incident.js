const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema({
  incidentId: { type: String, required: true, unique: true, trim: true, index: true },
  warningId: { type: mongoose.Schema.Types.ObjectId, ref: "Warning", default: null },
  hazardType: { type: String, required: true, trim: true },
  severity: { type: String, required: true, enum: ["WATCH", "WARNING", "EMERGENCY"] },
  district: { type: String, required: true, trim: true },
  affectedArea: { type: String, trim: true },
  affectedPopulation: { type: Number, min: 0 },
  status: { type: String, required: true, enum: ["ACTIVE", "RESPONSE_IN_PROGRESS", "RESOLVED"] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Incident", incidentSchema);
