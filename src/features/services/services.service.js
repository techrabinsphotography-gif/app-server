const PhotoService = require('../../models/PhotoService');
const Package = require('../../models/Package');
const { AppError } = require('../../utils/apiResponse');

const listServices = async (category) => {
  const filter = { isActive: true };
  if (category) filter.category = category.toUpperCase();
  return PhotoService.find(filter).sort({ createdAt: -1 });
};

const getServiceBySlug = async (slug) => {
  const service = await PhotoService.findOne({ slug, isActive: true });
  if (!service) throw new AppError('Service not found', 404);
  const packages = await Package.find({ serviceId: service._id });
  return { service, packages };
};

const getPackagesBySlug = async (slug) => {
  const service = await PhotoService.findOne({ slug, isActive: true });
  if (!service) throw new AppError('Service not found', 404);
  return Package.find({ serviceId: service._id });
};

const createService = async (data) => PhotoService.create(data);

const updateService = async (id, data) => {
  const service = await PhotoService.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!service) throw new AppError('Service not found', 404);
  return service;
};

const deleteService = async (id) => {
  const service = await PhotoService.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!service) throw new AppError('Service not found', 404);
  return service;
};

module.exports = { listServices, getServiceBySlug, getPackagesBySlug, createService, updateService, deleteService };
