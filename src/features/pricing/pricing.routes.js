'use strict';
const express = require('express');
const Package = require('../../models/Package');
const Addon   = require('../../models/Addon');
const PhotoService = require('../../models/PhotoService');
const { AppError } = require('../../utils/apiResponse');

const router = express.Router();

// ── PACKAGES ──────────────────────────────────────────────────────────────────

// GET /api/v1/pricing/packages?serviceId=xxx   — list packages for a service
router.get('/packages', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.serviceId) filter.serviceId = req.query.serviceId;
    const packages = await Package.find(filter).sort({ price: 1 });
    res.json({ success: true, data: packages });
  } catch (err) { next(err); }
});

// POST /api/v1/pricing/packages  — create a package
router.post('/packages', async (req, res, next) => {
  try {
    const { serviceId, tier, name, price, features, sessionHours, edited } = req.body;
    if (!serviceId || !tier || !name || price == null) {
      throw new AppError('serviceId, tier, name and price are required', 400);
    }
    const pkg = await Package.create({ serviceId, tier, name, price, features: features || [], sessionHours: sessionHours || 0, edited: edited || 0 });
    res.status(201).json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// PUT /api/v1/pricing/packages/:id — update a package
router.put('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) throw new AppError('Package not found', 404);
    res.json({ success: true, data: pkg });
  } catch (err) { next(err); }
});

// DELETE /api/v1/pricing/packages/:id
router.delete('/packages/:id', async (req, res, next) => {
  try {
    await Package.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Package permanently deleted' });
  } catch (err) { next(err); }
});

// ── ADDONS ────────────────────────────────────────────────────────────────────

// GET /api/v1/pricing/addons
router.get('/addons', async (req, res, next) => {
  try {
    const addons = await Addon.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: addons });
  } catch (err) { next(err); }
});

// POST /api/v1/pricing/addons
router.post('/addons', async (req, res, next) => {
  try {
    const { name, price } = req.body;
    if (!name || price == null) throw new AppError('name and price are required', 400);
    const addon = await Addon.create({ name, price });
    res.status(201).json({ success: true, data: addon });
  } catch (err) { next(err); }
});

// PUT /api/v1/pricing/addons/:id
router.put('/addons/:id', async (req, res, next) => {
  try {
    const addon = await Addon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!addon) throw new AppError('Addon not found', 404);
    res.json({ success: true, data: addon });
  } catch (err) { next(err); }
});

// DELETE /api/v1/pricing/addons/:id
router.delete('/addons/:id', async (req, res, next) => {
  try {
    await Addon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Addon permanently deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
