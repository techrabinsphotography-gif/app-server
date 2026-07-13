const PhotoService = require('../../models/PhotoService');
const Package = require('../../models/Package');
const { AppError } = require('../../utils/apiResponse');

// Public — only active
const listServices = async (category) => {
  const filter = { isActive: true };
  if (category) filter.category = category.toUpperCase();
  return PhotoService.find(filter).sort({ createdAt: -1 });
};

// Admin — all services regardless of isActive
const listAllServices = async (category) => {
  const filter = {};
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

// Soft delete (public-facing — hides from app)
const deleteService = async (id) => {
  const service = await PhotoService.findByIdAndUpdate(id, { isActive: false }, { new: true });
  if (!service) throw new AppError('Service not found', 404);
  return service;
};

// Hard delete (admin panel — permanently removes)
const hardDeleteService = async (id) => {
  const service = await PhotoService.findByIdAndDelete(id);
  if (!service) throw new AppError('Service not found', 404);

  // also delete all pricing packages related to this service
  await Package.deleteMany({ serviceId: id });

  return service;
};

// Get trending services (public)
const getTrendingServices = async () => {
  return PhotoService.find({ isActive: true, isTrending: true }).sort({ createdAt: -1 }).limit(5);
};

// Toggle trending (admin) — max 5
const toggleTrending = async (id) => {
  const service = await PhotoService.findById(id);
  if (!service) throw new AppError('Service not found', 404);

  if (!service.isTrending) {
    const count = await PhotoService.countDocuments({ isTrending: true });
    if (count >= 5) throw new AppError('Maximum 5 trending services allowed. Remove one first.', 400);
  }

  service.isTrending = !service.isTrending;
  await service.save();
  return service;
};

module.exports = { listServices, listAllServices, getServiceBySlug, getPackagesBySlug, createService, updateService, deleteService, hardDeleteService, getTrendingServices, toggleTrending };
