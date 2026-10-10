const { randomBytes } = require("node:crypto");
const mongoose = require("mongoose");
const hazardRepository = require("../repositories/hazardRepository");
const warningRepository = require("../repositories/warningRepository");
const warningDraftRepository = require("../repositories/warningDraftRepository");
const AppError = require("../errors/AppError");
const GroundReport = require("../modules/reports/report.model");
const Incident = require("../models/Incident");

const HAZARD_SEVERITIES = ["Low", "Medium", "High"];
const HAZARD_STATUSES = ["Monitoring", "Active", "Warning Issued", "Pending"];
const WARNING_LEVELS = ["Low", "Medium", "High", "Very High"];
const WARNING_CHANNELS = ["Push Notification", "SMS Alert", "Audible / Siren"];
const HAZARD_UPDATE_FIELDS = new Set(["severity", "status", "confidence", "description"]);
const DRAFT_FIELDS = new Set(["level", "urgency", "confidence", "recommendation", "districts", "areas", "title", "message", "instructions", "language", "format", "channels", "start", "end", "expiry", "remarks"]);

const toHazardResponse = (hazard) => ({
  id: hazard.hazardId,
  type: hazard.type,
  district: hazard.district,
  severity: hazard.severity,
  status: hazard.status,
  updated: new Date(hazard.updatedAt).toLocaleTimeString("en-LK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" }),
  population: hazard.population,
  confidence: hazard.confidence,
  description: hazard.description,
  source: hazard.source,
  ds: hazard.ds,
  location: hazard.location,
  updatedAt: hazard.updatedAt,
});

const toWarningResponse = (warning) => {
  const details = warning.warning;
  const title = details?.title || warning.title || (warning.hazardType ? `${warning.hazardType} Warning` : "Warning details unavailable");

  return {
    id: warning.warningId,
    hazardId: warning.hazardId,
    reportId: warning.sourceReportId ? String(warning.sourceReportId) : "",
    level: warning.level || warning.severity,
    status: warning.status,
    district: warning.district,
    areas: warning.areas || (warning.targetArea ? [warning.targetArea] : []),
    channels: warning.channels || [],
    target: warning.target ?? 0,
    delivered: warning.delivered ?? 0,
    pending: warning.pending ?? 0,
    failed: warning.failed ?? 0,
    escalated: warning.escalated ?? false,
    warning: details || { title, message: warning.message || "" },
    title,
    deliveryChannels: warning.deliveryChannels || [],
    audit: warning.audit || [],
    createdAt: warning.createdAt,
    updatedAt: warning.updatedAt,
  };
};

const createHazardWarningService = (dependencies = {}) => {
  const hazards = dependencies.hazardRepository || hazardRepository;
  const warnings = dependencies.warningRepository || warningRepository;
  const drafts = dependencies.warningDraftRepository || warningDraftRepository;
  const mongo = dependencies.mongoose || mongoose;
  const groundReports = dependencies.groundReportModel || GroundReport;
  const incidents = dependencies.incidentModel || Incident;
  const clock = dependencies.clock || (() => new Date());
  const makeWarningId = dependencies.makeWarningId || (() => `WRN-${clock().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`);

  const withTransaction = async (operation) => {
    const session = await mongo.startSession();
    try {
      let result;
      await session.withTransaction(async () => { result = await operation(session); });
      return result;
    } finally {
      await session.endSession();
    }
  };

  const listHazards = async (query = {}) => {
    const filters = {};
    if (query.type && query.type !== "All types") filters.type = query.type;
    if (query.district && query.district !== "All districts") filters.district = query.district;
    if (query.severity && query.severity !== "All severities") {
      if (!HAZARD_SEVERITIES.includes(query.severity)) throw new AppError("Invalid hazard severity filter", 400, "INVALID_FILTER");
      filters.severity = query.severity;
    }
    if (query.status && query.status !== "All statuses") {
      if (!HAZARD_STATUSES.includes(query.status)) throw new AppError("Invalid hazard status filter", 400, "INVALID_FILTER");
      filters.status = query.status;
    }
    const hazardsFound = await hazards.findAll(filters);
    const search = String(query.search || "").trim().toLocaleLowerCase();
    return hazardsFound
      .filter((hazard) => !search || `${hazard.hazardId} ${hazard.type} ${hazard.district}`.toLocaleLowerCase().includes(search))
      .map(toHazardResponse);
  };

  const getHazard = async (hazardId) => {
    const hazard = await hazards.findById(String(hazardId).toUpperCase());
    if (!hazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
    return toHazardResponse(hazard);
  };

  const updateHazard = async (hazardId, changes = {}) => {
    const entries = Object.entries(changes);
    if (entries.length === 0 || entries.some(([field]) => !HAZARD_UPDATE_FIELDS.has(field))) {
      throw new AppError("Only severity, status, confidence, and description can be updated", 400, "INVALID_HAZARD_UPDATE");
    }
    if (changes.status && !HAZARD_STATUSES.includes(changes.status)) throw new AppError("Invalid hazard status", 400, "INVALID_HAZARD_STATUS");
    if (changes.severity && !HAZARD_SEVERITIES.includes(changes.severity)) throw new AppError("Invalid hazard severity", 400, "INVALID_HAZARD_SEVERITY");
    if (changes.confidence && !["Low", "Medium", "High"].includes(changes.confidence)) throw new AppError("Invalid confidence level", 400, "INVALID_CONFIDENCE");
    if (changes.description !== undefined && (!String(changes.description).trim() || String(changes.description).length > 1500)) {
      throw new AppError("Description must contain 1 to 1500 characters", 400, "INVALID_DESCRIPTION");
    }
    const hazard = await hazards.updateById(String(hazardId).toUpperCase(), changes);
    if (!hazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
    return toHazardResponse(hazard);
  };

  const getDraft = async (hazardId) => {
    const normalizedHazardId = String(hazardId).toUpperCase();
    const hazard = await hazards.findById(normalizedHazardId);
    if (!hazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
    const draft = await drafts.findByHazardId(normalizedHazardId);
    return draft ? { hazardId: draft.hazardId, warning: draft.warning, updatedAt: draft.updatedAt } : null;
  };

  const saveDraft = async (hazardId, warning) => {
    const normalizedHazardId = String(hazardId || "").trim().toUpperCase();
    if (!normalizedHazardId || !warning || typeof warning !== "object" || Array.isArray(warning)) {
      throw new AppError("A hazard and warning draft are required", 400, "INVALID_DRAFT");
    }
    const entries = Object.entries(warning);
    if (entries.length === 0) throw new AppError("A warning draft cannot be empty", 400, "INVALID_DRAFT");
    if (entries.some(([field]) => !DRAFT_FIELDS.has(field))) {
      throw new AppError("The warning draft contains unsupported fields", 400, "INVALID_DRAFT_FIELDS");
    }
    if (JSON.stringify(warning).length > 12000) throw new AppError("Warning draft is too large", 413, "DRAFT_TOO_LARGE");
    const hazard = await hazards.findById(normalizedHazardId);
    if (!hazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
    const draft = await drafts.saveByHazardId(normalizedHazardId, warning);
    return { hazardId: draft.hazardId, warning: draft.warning, updatedAt: draft.updatedAt };
  };

  const listWarnings = async (query = {}) => {
    const filters = {};
    if (query.hazardId) filters.hazardId = String(query.hazardId).toUpperCase();
    if (query.status) {
      if (!["Published", "Cancelled"].includes(query.status)) throw new AppError("Invalid warning status filter", 400, "INVALID_FILTER");
      filters.status = query.status;
    }
    return (await warnings.findAll(filters)).map(toWarningResponse);
  };

  const getWarning = async (warningId) => {
    const warning = await warnings.findById(String(warningId).toUpperCase());
    if (!warning) throw new AppError("Warning not found", 404, "WARNING_NOT_FOUND");
    return toWarningResponse(warning);
  };

  const validatePublishPayload = (payload) => {
    if (!payload || typeof payload !== "object") throw new AppError("Warning details are required", 400, "INVALID_WARNING");
    const details = payload.warning;
    if (!details || typeof details !== "object") throw new AppError("Warning message details are required", 400, "INVALID_WARNING");
    if (!WARNING_LEVELS.includes(details.level)) throw new AppError("Select a valid warning level", 400, "INVALID_WARNING_LEVEL");
    if (!Array.isArray(details.areas) || details.areas.length === 0) throw new AppError("Select at least one affected area", 400, "AREAS_REQUIRED");
    if (!Array.isArray(details.districts) || details.districts.length === 0) throw new AppError("Select at least one district", 400, "DISTRICTS_REQUIRED");
    if (!Array.isArray(details.channels) || details.channels.length === 0 || details.channels.some((channel) => !WARNING_CHANNELS.includes(channel))) {
      throw new AppError("Select at least one valid delivery channel", 400, "INVALID_CHANNELS");
    }
    for (const field of ["title", "message", "instructions", "recommendation", "language", "format", "urgency"]) {
      if (!String(details[field] || "").trim()) throw new AppError(`${field} is required`, 400, "INVALID_WARNING");
    }
    const start = new Date(details.start);
    const end = new Date(details.end);
    const expiry = new Date(details.expiry);
    if ([start, end, expiry].some((date) => Number.isNaN(date.getTime())) || start >= end || expiry < end) {
      throw new AppError("Warning dates must be valid and expiry must be on or after the end time", 400, "INVALID_WARNING_DATES");
    }
    return { ...details, start, end, expiry, districts: details.districts?.length ? details.districts : [payload.district].filter(Boolean) };
  };

  const publishWarning = async (payload) => {
    const hazardId = String(payload?.hazardId || "").trim().toUpperCase();
    if (!hazardId) throw new AppError("A hazard must be selected", 400, "HAZARD_REQUIRED");
    const details = validatePublishPayload(payload);
    const requestedTarget = Number(payload.target);
    const target = Number.isSafeInteger(requestedTarget) && requestedTarget > 0
      ? requestedTarget
      : details.areas.length * 12480;

    return withTransaction(async (session) => {
      const hazard = await hazards.findById(hazardId, session);
      if (!hazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
      const reportId = String(payload?.reportId || "").trim();
      let report = null;
      if (reportId) {
        if (!mongo.isValidObjectId(reportId)) throw new AppError("Ground report not found", 404, "REPORT_NOT_FOUND");
        report = await groundReports.findById(reportId).session(session).lean();
        if (!report) throw new AppError("Ground report not found", 404, "REPORT_NOT_FOUND");
        if (report.status === "WARNING_ISSUED" && report.warningId) {
          const existingWarning = await warnings.findById(report.warningId, session);
          if (existingWarning) return toWarningResponse(existingWarning);
        }
        if (report.status !== "FORWARDED_TO_DUTY_OFFICER") {
          throw new AppError("Only a forwarded ground report can be used to issue a warning", 409, "REPORT_NOT_FORWARDED");
        }
      }
      const now = clock();
      const warningId = makeWarningId();
      const document = await warnings.create({
        warningId,
        hazardId,
        sourceReportId: report?._id || null,
        level: details.level,
        status: "Published",
        district: details.districts.join(", ") || hazard.district,
        areas: details.areas,
        channels: details.channels,
        target,
        delivered: 0,
        pending: target,
        failed: 0,
        escalated: false,
        previousHazardStatus: hazard.status,
        warning: details,
        deliveryChannels: details.channels.map((channel) => ({ channel, target, delivered: 0, pending: target, failed: 0, retryCount: 0 })),
        audit: [{ type: "PUBLISHED", message: "Warning recorded and queued for delivery", occurredAt: now }],
      }, session);
      const updatedHazard = await hazards.updateById(hazardId, { status: "Warning Issued" }, session);
      if (!updatedHazard) throw new AppError("Hazard not found", 404, "HAZARD_NOT_FOUND");
      if (report) {
        const updatedReport = await groundReports.findOneAndUpdate(
          { _id: report._id, status: "FORWARDED_TO_DUTY_OFFICER" },
          { $set: { status: "WARNING_ISSUED", warningId, warningIssuedAt: now } },
          { new: true, session },
        );
        if (!updatedReport) throw new AppError("Ground report status changed before publication", 409, "REPORT_STATE_CHANGED");
      }
      const incidentId = `INC-${now.getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
      const severity = details.level === "Very High" ? "EMERGENCY" : details.level === "High" ? "WARNING" : "WATCH";
      await incidents.create([{
        incidentId,
        warningId: document._id,
        hazardType: hazard.type,
        severity,
        district: details.districts.join(", ") || hazard.district,
        affectedArea: details.areas.join(", "),
        affectedPopulation: target,
        status: "ACTIVE",
        createdAt: now,
      }], { session });
      return toWarningResponse(document);
    });
  };

  const queueRetry = async (warningId, channel) => {
    if (!WARNING_CHANNELS.includes(channel)) throw new AppError("Select a valid delivery channel", 400, "INVALID_CHANNEL");
    const updated = await warnings.queueRetry(String(warningId).toUpperCase(), channel, clock());
    if (!updated) {
      const current = await warnings.findById(String(warningId).toUpperCase());
      if (!current) throw new AppError("Warning not found", 404, "WARNING_NOT_FOUND");
      if (current.status !== "Published") throw new AppError("Cancelled warnings cannot be retried", 409, "WARNING_NOT_ACTIVE");
      throw new AppError("The selected channel is not part of this warning", 400, "CHANNEL_NOT_SELECTED");
    }
    return toWarningResponse(updated);
  };

  const escalateWarning = async (warningId) => {
    const id = String(warningId).toUpperCase();
    const current = await warnings.findById(id);
    if (!current) throw new AppError("Warning not found", 404, "WARNING_NOT_FOUND");
    if (current.status !== "Published") throw new AppError("Cancelled warnings cannot be escalated", 409, "WARNING_NOT_ACTIVE");
    if (current.escalated) throw new AppError("This warning is already marked for escalation", 409, "ALREADY_ESCALATED");
    const occurredAt = clock();
    const updated = await warnings.updateById(id, {
      $set: { escalated: true },
      $push: { audit: { type: "ESCALATED", message: "Warning marked for regional review", occurredAt } },
    });
    return toWarningResponse(updated);
  };

  const cancelWarning = async (warningId) => {
    const id = String(warningId).toUpperCase();
    return withTransaction(async (session) => {
      const current = await warnings.findById(id, session);
      if (!current) throw new AppError("Warning not found", 404, "WARNING_NOT_FOUND");
      if (current.status === "Cancelled") throw new AppError("This warning is already cancelled", 409, "WARNING_ALREADY_CANCELLED");
      const occurredAt = clock();
      const updated = await warnings.updateById(id, {
        $set: { status: "Cancelled" },
        $push: { audit: { type: "CANCELLED", message: "Warning cancelled by officer", occurredAt } },
      }, session);
      const anotherPublishedWarning = await warnings.hasPublishedForHazard(current.hazardId, id, session);
      if (!anotherPublishedWarning) {
        await hazards.updateById(current.hazardId, { status: current.previousHazardStatus || "Monitoring" }, session);
      }
      return toWarningResponse(updated);
    });
  };

  return { listHazards, getHazard, updateHazard, getDraft, saveDraft, listWarnings, getWarning, publishWarning, queueRetry, escalateWarning, cancelWarning };
};

module.exports = createHazardWarningService();
module.exports.createHazardWarningService = createHazardWarningService;
module.exports.toHazardResponse = toHazardResponse;
module.exports.toWarningResponse = toWarningResponse;
