const mongoose = require("mongoose");

const distributionSchema = new mongoose.Schema({
  distributionId: { type: String, required: true, unique: true, index: true },
  requestId: { type: String, unique: true, sparse: true, index: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: "Incident", required: true, index: true },
  responseAssignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "ResponseAssignment", default: null },
  shelterId: { type: mongoose.Schema.Types.ObjectId, ref: "Shelter", required: true },
  inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem", required: true },
  resourceOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: "ResourceOwner", required: true },
  quantity: { type: Number, required: true, min: 1 },
  deliveryResourceId: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryResource", required: true },
  status: { type: String, required: true, enum: ["EN_ROUTE", "DELIVERED", "PENDING_SYNC"], default: "EN_ROUTE" },
  deliveredAt: { type: Date, default: null },
  eta: Date,
  notes: { type: String, trim: true, maxlength: 500 },
  createdBy: { type: String, required: true, default: "District Officer" },
  issuedAt: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Distribution", distributionSchema);
