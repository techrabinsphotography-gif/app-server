'use strict';
const svc = require('./services.service');
const { sendSuccess } = require('../../utils/apiResponse');
const notifSvc = require('../../utils/notificationService');

const listServices = async (req, res, next) => {
  try {
    const data = await svc.listServices(req.query.category);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const listAllServices = async (req, res, next) => {
  try {
    const data = await svc.listAllServices(req.query.category);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getServiceBySlug = async (req, res, next) => {
  try {
    const data = await svc.getServiceBySlug(req.params.slug);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getPackagesBySlug = async (req, res, next) => {
  try {
    const data = await svc.getPackagesBySlug(req.params.slug);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const createService = async (req, res, next) => {
  try {
    const data = await svc.createService(req.body);
    sendSuccess(res, data, 'Service created', 201);

    // ── Auto-notify all users ─────────────────────────────────────────────
    notifSvc.broadcast({
      title: '📸 New Service Added!',
      message: `${data.title} is now available. Tap to explore packages and book your session.`,
      type: 'service',
      imageUrl: data.coverImage || null,
      actionUrl: `/details/servicedetails?slug=${data.slug}`,
    }).catch(() => { }); // non-blocking — never fail the request
  } catch (err) { next(err); }
};

const updateService = async (req, res, next) => {
  try {
    const data = await svc.updateService(req.params.id, req.body);
    sendSuccess(res, data, 'Service updated');

    // Notify only if it's still active (not being soft-deleted)
    if (data.isActive) {
      notifSvc.broadcast({
        title: '✨ Service Updated',
        message: `${data.title} has been updated with new details. Check it out!`,
        type: 'service',
        imageUrl: data.coverImage || null,
        actionUrl: `/details/servicedetails?slug=${data.slug}`,
      }).catch(() => { });
    }
  } catch (err) { next(err); }
};

const deleteService = async (req, res, next) => {
  try {
    await svc.deleteService(req.params.id);
    sendSuccess(res, {}, 'Service deleted');
  } catch (err) { next(err); }
};

const hardDeleteService = async (req, res, next) => {
  try {
    await svc.hardDeleteService(req.params.id);
    sendSuccess(res, {}, 'Service permanently deleted');
  } catch (err) { next(err); }
};

const getTrendingServices = async (req, res, next) => {
  try {
    const data = await svc.getTrendingServices();
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const toggleTrending = async (req, res, next) => {
  try {
    const data = await svc.toggleTrending(req.params.id);
    sendSuccess(res, data, 'Trending status updated');
  } catch (err) { next(err); }
};

module.exports = {
  listServices, listAllServices, getServiceBySlug, getPackagesBySlug,
  createService, updateService, deleteService, hardDeleteService,
  getTrendingServices, toggleTrending,
};
