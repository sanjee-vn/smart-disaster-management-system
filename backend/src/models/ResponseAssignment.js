const mongoose = require("mongoose");

const responseAssignmentSchema = new mongoose.Schema({
  responseId: { type: String, required: true, unique: true, trim: true, index: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true },
  teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ResponseTeam" }],
  priority: { type: String, trim: true },
  destination: { type: String, trim: true },
  instructions: { type: String, trim: true },
  requiredCapabilities: [{ type: String, enum: ["RESCUE", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL", "SHELTER", "EVACUATION", "FOOD", "WATER", "MEDICINE"] }],
  status: { type: String, required: true, enum: ["PLANNED", "DISPATCHED", "IN_PROGRESS", "COMPLETED"] },
  dispatchedAt: Date,
  eta: Date,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ResponseAssignment", responseAssignmentSchema);
