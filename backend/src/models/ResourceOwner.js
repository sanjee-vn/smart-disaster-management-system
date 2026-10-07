const mongoose = require("mongoose");

const resourceOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  type: { type: String, required: true, enum: ["GOVERNMENT", "NGO", "ARMED_FORCES"] },
}, { timestamps: true });

module.exports = mongoose.model("ResourceOwner", resourceOwnerSchema);
