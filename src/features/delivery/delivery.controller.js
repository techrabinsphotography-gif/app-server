const svc = require('./delivery.service');
const { sendSuccess } = require('../../utils/apiResponse');

// ── Admin ────────────────────────────────────────────────────────────────────

const listAllTracking = async (req, res, next) => {
  try {
    const data = await svc.listAllTracking(req.query);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getAdminTracking = async (req, res, next) => {
  try {
    const data = await svc.getOrCreateTracking(req.params.bookingId);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const updateStage = async (req, res, next) => {
  try {
    const { stage, note } = req.body;
    const data = await svc.updateStage(req.params.bookingId, stage, note);
    sendSuccess(res, data, 'Stage updated');
  } catch (err) { next(err); }
};

const updateOrderItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    const data = await svc.updateOrderItems(req.params.bookingId, items);
    sendSuccess(res, data, 'Order items updated');
  } catch (err) { next(err); }
};

const addMediaPreview = async (req, res, next) => {
  try {
    const data = await svc.addMediaPreview(req.params.bookingId, req.body);
    sendSuccess(res, data, 'Preview added');
  } catch (err) { next(err); }
};

const removeMediaPreview = async (req, res, next) => {
  try {
    const data = await svc.removeMediaPreview(req.params.bookingId, req.params.previewId);
    sendSuccess(res, data, 'Preview removed');
  } catch (err) { next(err); }
};

const markDelivered = async (req, res, next) => {
  try {
    const data = await svc.markDelivered(req.params.bookingId);
    sendSuccess(res, data, 'Marked as delivered');
  } catch (err) { next(err); }
};

// ── User ─────────────────────────────────────────────────────────────────────

const getUserTracking = async (req, res, next) => {
  try {
    const data = await svc.getTrackingForUser(req.params.bookingId, req.user.id, req.user.role);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

module.exports = {
  listAllTracking,
  getAdminTracking,
  updateStage,
  updateOrderItems,
  addMediaPreview,
  removeMediaPreview,
  markDelivered,
  getUserTracking,
};
