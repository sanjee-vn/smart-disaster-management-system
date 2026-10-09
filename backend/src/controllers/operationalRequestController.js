const service = require("../services/operationalRequestService");
const list = async (req, res, next) => { try { res.json({ success: true, data: await service.list(req.query) }); } catch (error) { next(error); } };
const create = async (req, res, next) => { try { res.status(201).json({ success: true, data: await service.create(req.body) }); } catch (error) { next(error); } };
const review = async (req, res, next) => { try { res.json({ success: true, data: await service.review(req.params.requestId, req.body) }); } catch (error) { next(error); } };
const dispatch = async (req, res, next) => { try { res.json({ success: true, data: await service.dispatch(req.params.requestId, req.body) }); } catch (error) { next(error); } };
const deliverByStaff = async (req, res, next) => { try { res.json({ success: true, data: await service.deliverByStaff(req.params.requestId) }); } catch (error) { next(error); } };
module.exports = { list, create, review, dispatch, deliverByStaff };
