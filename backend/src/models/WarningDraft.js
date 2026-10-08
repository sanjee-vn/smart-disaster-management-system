const mongoose = require("mongoose");

const warningDraftSchema = new mongoose.Schema({
  hazardId: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  warning: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model("WarningDraft", warningDraftSchema);
