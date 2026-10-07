const mongoose = require("mongoose");

const pendingRequestSchema = new mongoose.Schema({
  item: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, trim: true, default: "units" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  status: { type: String, default: "Pending" },
}, { _id: false });

const incomingResourceSchema = new mongoose.Schema({
  distributionId: { type: String, trim: true },
  item: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, trim: true, default: "units" },
  owner: { type: String, trim: true },
  deliveryResource: { type: String, trim: true },
  status: { type: String, enum: ["Scheduled", "In Transit", "Delivered", "Delayed", "EN_ROUTE"], default: "Scheduled" },
  eta: Date,
}, { _id: false });

const shelterSchema = new mongoose.Schema({
  shelterId: { type: String, required: true, unique: true, sparse: true, trim: true },
  name: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  incidentId: { type: String, required: true, index: true },
  occupancy: { type: Number, required: true, min: 0 },
  capacity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["Operational", "Near Capacity", "At Capacity", "Inactive"], default: "Operational" },
  pendingRequests: { type: [pendingRequestSchema], default: [] },
  incomingResources: { type: [incomingResourceSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Shelter", shelterSchema);
