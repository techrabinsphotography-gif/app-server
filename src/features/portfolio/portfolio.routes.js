'use strict';
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');
const Portfolio = require('../../models/Portfolio');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

// Cloudinary storage for portfolio images
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'robin-studio/portfolio',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto:good' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

// ── PUBLIC: Get all portfolio photos ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const photos = await Portfolio.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Upload a new portfolio photo ──────────────────────────────────────
router.post('/', authenticate, authorize('ADMIN'), (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });

    const photo = await Portfolio.create({
      imageUrl: req.file.path,
      publicId: req.file.filename,
      caption: req.body.caption || '',
      category: req.body.category || 'General',
      order: Number(req.body.order) || 0,
    });

    res.status(201).json({ success: true, data: photo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Delete a portfolio photo ──────────────────────────────────────────
router.delete('/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const photo = await Portfolio.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    // Delete from Cloudinary
    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId).catch(() => { });
    }

    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
