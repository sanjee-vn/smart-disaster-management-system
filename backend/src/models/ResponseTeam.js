const mongoose = require("mongoose");

const responseTeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
  type: { type: String, required: true, trim: true },
  currentLocation: { type: String, trim: true },
  capacity: { type: Number, min: 0 },
  status: { type: String, required: true, enum: ["AVAILABLE"], default: "AVAILABLE" },
}, { timestamps: true });

module.exports = mongoose.model("ResponseTeam", responseTeamSchema);
