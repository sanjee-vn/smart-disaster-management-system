const mongoose = require("mongoose");

const deliveryResourceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  type: { type: String, required: true, trim: true },
  status: { type: String, required: true, enum: ["AVAILABLE", "IN_USE"], index: true },
  currentLocation: { type: String, required: true, trim: true },
}, { timestamps: true });

module.exports = mongoose.model("DeliveryResource", deliveryResourceSchema);
