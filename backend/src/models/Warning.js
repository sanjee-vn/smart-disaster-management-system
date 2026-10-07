const mongoose = require("mongoose");

const warningDetailsSchema = new mongoose.Schema({
  level: { type: String, required: true, enum: ["Low", "Medium", "High", "Very High"] },
  urgency: { type: String, required: true, trim: true },
  confidence: { type: String, required: true, enum: ["Low", "Medium", "High"] },
  recommendation: { type: String, required: true, trim: true, maxlength: 500 },
  districts: { type: [String], required: true, validate: [(items) => items.length > 0, "Select at least one district"] },
  areas: { type: [String], required: true, validate: [(items) => items.length > 0, "Select at least one affected area"] },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  instructions: { type: String, required: true, trim: true, maxlength: 1000 },
  language: { type: String, required: true, trim: true },
  format: { type: String, required: true, trim: true },
  channels: {
    type: [String], required: true,
    enum: ["Push Notification", "SMS Alert", "Audible / Siren"],
    validate: [(items) => items.length > 0, "Select at least one delivery channel"],
  },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  expiry: { type: Date, required: true },
  remarks: { type: String, trim: true, maxlength: 500, default: "" },
}, { _id: false });

const deliveryChannelSchema = new mongoose.Schema({
  channel: { type: String, required: true, enum: ["Push Notification", "SMS Alert", "Audible / Siren"] },
  target: { type: Number, min: 0, default: 0 },
  delivered: { type: Number, min: 0, default: 0 },
  pending: { type: Number, min: 0, default: 0 },
  failed: { type: Number, min: 0, default: 0 },
  retryCount: { type: Number, min: 0, default: 0 },
  lastRetryAt: Date,
}, { _id: false });

const auditEventSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["PUBLISHED", "RETRY_QUEUED", "ESCALATED", "CANCELLED"] },
  message: { type: String, required: true, trim: true },
  channel: { type: String, trim: true },
  occurredAt: { type: Date, required: true, default: Date.now },
}, { _id: false });

const warningSchema = new mongoose.Schema({
  warningId: { type: String, required: true, unique: true, trim: true },
  hazardId: { type: String, required: true, index: true, trim: true, uppercase: true },
  level: { type: String, required: true, enum: ["Low", "Medium", "High", "Very High"] },
  status: { type: String, required: true, enum: ["Published", "Cancelled"], default: "Published", index: true },
  district: { type: String, required: true, trim: true },
  areas: { type: [String], required: true },
  channels: { type: [String], required: true },
  target: { type: Number, required: true, min: 1 },
  delivered: { type: Number, required: true, min: 0, default: 0 },
  pending: { type: Number, required: true, min: 0 },
  failed: { type: Number, required: true, min: 0, default: 0 },
  escalated: { type: Boolean, default: false },
  previousHazardStatus: { type: String, enum: ["Monitoring", "Active", "Warning Issued", "Pending"] },
  warning: { type: warningDetailsSchema, required: true },
  deliveryChannels: { type: [deliveryChannelSchema], default: [] },
  audit: { type: [auditEventSchema], default: [] },
}, { timestamps: true, versionKey: false });

warningSchema.index({ hazardId: 1, createdAt: -1 });

module.exports = mongoose.model("Warning", warningSchema);
