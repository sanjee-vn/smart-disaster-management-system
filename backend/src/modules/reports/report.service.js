const GroundReport = require("./report.model");
const Warning = require("../../models/Warning");
const Hazard = require("../../models/Hazard");
const AppError = require("../../errors/AppError");

const REVIEW_TRANSITIONS = {
  PENDING: new Set(["VERIFIED", "REJECTED", "CLARIFICATION_REQUESTED"]),
  VERIFIED: new Set(["FORWARDED_TO_DUTY_OFFICER", "PENDING"]),
  FORWARDED_TO_DUTY_OFFICER: new Set([]),
  REJECTED: new Set(["PENDING"]),
  CLARIFICATION_REQUESTED: new Set(["PENDING"]),
  WARNING_ISSUED: new Set([]),
};

const toReportResponse = (report) => ({
  id: String(report._id),
  reportId: `RPT-${String(report._id).slice(-8).toUpperCase()}`,
  title: report.title,
  description: report.description,
  disasterType: report.disasterType,
  latitude: report.latitude,
  longitude: report.longitude,
  areaLabel: `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`,
  district: "",
  photo: report.photo || null,
  citizenId: report.citizenId,
  status: report.status,
  operatorNotes: report.operatorNotes || "",
  validatedAt: report.validatedAt || null,
  forwardedAt: report.forwardedAt || null,
  warningId: report.warningId || "",
  warningIssuedAt: report.warningIssuedAt || null,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
});

async function createGroundReport(data) {
  const { title, description, disasterType, latitude, longitude, citizenId, photo } = data;
  return GroundReport.create({
    title, description, disasterType, latitude, longitude, citizenId,
    photo: photo ?? null,
    status: "PENDING",
  });
}

async function listReports({ status } = {}) {
  const filter = status ? { status } : {};
  return (await GroundReport.find(filter).sort({ createdAt: -1 }).limit(250).lean()).map(toReportResponse);
}

async function listCitizenReports(citizenId) {
  return GroundReport.find({ citizenId }).sort({ createdAt: -1 }).limit(250).lean();
}

async function updateReportReview(reportId, changes = {}) {
  const report = await GroundReport.findById(reportId);
  if (!report) throw new AppError("Ground report not found", 404, "REPORT_NOT_FOUND");
  const nextStatus = String(changes.status || "").trim();
  if (!REVIEW_TRANSITIONS[report.status]?.has(nextStatus)) {
    throw new AppError(`Report cannot move from ${report.status} to ${nextStatus || "an empty status"}`, 409, "INVALID_REPORT_TRANSITION");
  }
  report.status = nextStatus;
  if (changes.operatorNotes !== undefined) report.operatorNotes = String(changes.operatorNotes || "").trim();
  if (nextStatus === "VERIFIED") report.validatedAt = new Date();
  if (nextStatus === "FORWARDED_TO_DUTY_OFFICER") report.forwardedAt = new Date();
  await report.save();
  return toReportResponse(report);
}

async function listPublishedAlerts() {
  const warnings = await Warning.find({ status: "Published" }).sort({ createdAt: -1 }).limit(100).lean();
  const [reports, hazards] = await Promise.all([
    GroundReport.find({ _id: { $in: warnings.map(item => item.sourceReportId).filter(Boolean) } }).lean(),
    Hazard.find({ hazardId: { $in: warnings.map(item => item.hazardId) } }).lean(),
  ]);
  return warnings.map((item) => {
    const report = reports.find(report => String(report._id) === String(item.sourceReportId));
    const hazard = hazards.find(hazard => hazard.hazardId === item.hazardId);
    const match = hazard?.location?.match(/^\s*(-?\d+(?:\.\d+)?)\s*([NS])\s*,\s*(-?\d+(?:\.\d+)?)\s*([EW])\s*$/i);
    const latitude = report?.latitude ?? (match ? Number(match[1]) * (match[2].toUpperCase() === 'S' ? -1 : 1) : null);
    const longitude = report?.longitude ?? (match ? Number(match[3]) * (match[4].toUpperCase() === 'W' ? -1 : 1) : null);
    const valid = Number.isFinite(latitude) && Math.abs(latitude) <= 90 && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
    return {
    id: item.warningId,
    title: item.warning?.title || `${item.level} warning`,
    message: item.warning?.message || "",
    instructions: item.warning?.instructions || "",
    level: item.level,
    district: item.district,
    areas: item.areas || [],
    start: item.warning?.start || item.createdAt,
    end: item.warning?.end || null,
    expiry: item.warning?.expiry || null,
    publishedAt: item.createdAt,
    disasterType: hazard?.type || report?.disasterType || 'Other',
    latitude: valid ? latitude : null,
    longitude: valid ? longitude : null,
    locationLabel: report ? 'Reported incident location' : 'Hazard location',
  };
  });
}

async function ensureHazardForReport(reportId) {
  const report = await GroundReport.findById(reportId).lean();
  if (!report) throw new AppError("Ground report not found", 404, "REPORT_NOT_FOUND");
  if (!["FORWARDED_TO_DUTY_OFFICER", "WARNING_ISSUED"].includes(report.status)) {
    throw new AppError("The report must be forwarded before creating a warning", 409, "REPORT_NOT_FORWARDED");
  }
  const shortId = String(report._id).slice(-8).toUpperCase();
  const locationMatch = report.title.match(/\b(?:near|in|at)\s+(.+)$/i);
  const district = locationMatch?.[1]?.trim() || "Reported Location";
  const hazard = await Hazard.findOneAndUpdate(
    { hazardId: `HZ-RPT-${shortId}` },
    { $setOnInsert: {
      hazardId: `HZ-RPT-${shortId}`,
      type: report.disasterType === "Landslide" ? "Landslide Risk" : report.disasterType,
      district,
      severity: "High",
      status: report.status === "WARNING_ISSUED" ? "Warning Issued" : "Active",
      population: "Assessment pending",
      confidence: "Medium",
      description: report.description,
      source: `Citizen ground report RPT-${shortId}`,
      ds: district,
      location: `${report.latitude.toFixed(4)} N, ${report.longitude.toFixed(4)} E`,
      reportedAt: report.createdAt,
    } },
    { new: true, upsert: true, runValidators: true },
  ).lean();
  return {
    id: hazard.hazardId, type: hazard.type, district: hazard.district,
    severity: hazard.severity, status: hazard.status, population: hazard.population,
    confidence: hazard.confidence, description: hazard.description, source: hazard.source,
    ds: hazard.ds, location: hazard.location, updatedAt: hazard.updatedAt,
  };
}

module.exports = { createGroundReport, listReports, listCitizenReports, updateReportReview, listPublishedAlerts, ensureHazardForReport, toReportResponse };
