const mongoose = require("mongoose");
const { DISASTER_TYPES, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_REFERENCE_LENGTH } = require("./report.constants");

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: MAX_TITLE_LENGTH },
  description: { type: String, required: true, trim: true, maxlength: MAX_DESCRIPTION_LENGTH },
  disasterType: { type: String, required: true, enum: DISASTER_TYPES },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  photo: { type: String, default: null, maxlength: MAX_REFERENCE_LENGTH },
  citizenId: { type: String, required: true, trim: true, maxlength: 100 },
  status: {
    type: String,
    enum: ["PENDING", "VERIFIED", "FORWARDED_TO_DUTY_OFFICER", "REJECTED", "CLARIFICATION_REQUESTED", "WARNING_ISSUED"],
    default: "PENDING",
    index: true,
  },
  operatorNotes: { type: String, trim: true, maxlength: 1000, default: "" },
  validatedAt: { type: Date, default: null },
  forwardedAt: { type: Date, default: null },
  warningId: { type: String, trim: true, default: "" },
  warningIssuedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("GroundReport", reportSchema);
