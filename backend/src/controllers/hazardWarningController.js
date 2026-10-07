const service = require("../services/hazardWarningService");

const listHazards = async (req, res) => res.json({ success: true, data: await service.listHazards(req.query) });
const getHazard = async (req, res) => res.json({ success: true, data: await service.getHazard(req.params.id) });
const updateHazard = async (req, res) => res.json({ success: true, data: await service.updateHazard(req.params.id, req.body) });
const getDraft = async (req, res) => res.json({ success: true, data: await service.getDraft(req.params.id) });
const saveDraft = async (req, res) => res.json({ success: true, data: await service.saveDraft(req.params.id, req.body?.warning) });
const listWarnings = async (req, res) => res.json({ success: true, data: await service.listWarnings(req.query) });
const getWarning = async (req, res) => res.json({ success: true, data: await service.getWarning(req.params.id) });
const publishWarning = async (req, res) => res.status(201).json({ success: true, data: await service.publishWarning(req.body) });
const queueRetry = async (req, res) => res.json({ success: true, data: await service.queueRetry(req.params.id, req.body.channel) });
const escalateWarning = async (req, res) => res.json({ success: true, data: await service.escalateWarning(req.params.id) });
const cancelWarning = async (req, res) => res.json({ success: true, data: await service.cancelWarning(req.params.id) });

module.exports = { listHazards, getHazard, updateHazard, getDraft, saveDraft, listWarnings, getWarning, publishWarning, queueRetry, escalateWarning, cancelWarning };
