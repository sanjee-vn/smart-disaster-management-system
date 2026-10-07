const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema({
  category: { type: String, required: true, enum: ["Water", "Food", "Medicine"], index: true },
  itemName: { type: String, required: true, trim: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "ResourceOwner", required: true, index: true },
  availableQuantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  status: { type: String, required: true, default: "ACTIVE" },
}, { timestamps: true });

inventoryItemSchema.index({ category: 1, itemName: 1, ownerId: 1 }, { unique: true });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
