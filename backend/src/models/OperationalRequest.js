const mongoose = require("mongoose");

const operationalRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true, index: true, trim: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
  capability: { type: String, required: true, enum: ["RESCUE", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL"] },
  planningRequirements: [{ type: String, enum: ["RESCUE", "POLICE", "ARMED_FORCES", "FIRE_RESCUE", "MEDICAL", "SHELTER", "EVACUATION", "FOOD", "WATER", "MEDICINE"] }],
  requestedPersonnelCount: { type: Number, required: true, min: 1 },
  requestedLocation: { type: String, required: true, trim: true, maxlength: 300 },
  requiredAt: { type: Date, required: true },
  priority: { type: String, required: true, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  notes: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, required: true, enum: ["PENDING", "APPROVED", "ACCEPTED", "REJECTED", "DISPATCHED", "DELIVERED", "COMPLETED"], default: "PENDING", index: true },
  reviewedBy: { type: String, trim: true, maxlength: 100, default: null },
  reviewedAt: { type: Date, default: null },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
  approvedTeamId: { type: mongoose.Schema.Types.ObjectId, ref: "ResponseTeam", default: null },
  staffAcceptedAt: { type: Date, default: null },
  dispatchedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("OperationalRequest", operationalRequestSchema);
