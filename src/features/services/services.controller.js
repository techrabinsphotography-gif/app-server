const svc = require('./services.service');
const { sendSuccess } = require('../../utils/apiResponse');

const listServices = async (req, res, next) => {
  try {
    const data = await svc.listServices(req.query.category);
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
  } catch (err) { next(err); }
};

const updateService = async (req, res, next) => {
  try {
    const data = await svc.updateService(req.params.id, req.body);
    sendSuccess(res, data, 'Service updated');
  } catch (err) { next(err); }
};

const deleteService = async (req, res, next) => {
  try {
    await svc.deleteService(req.params.id);
    sendSuccess(res, {}, 'Service deleted');
  } catch (err) { next(err); }
};

module.exports = { listServices, getServiceBySlug, getPackagesBySlug, createService, updateService, deleteService };
