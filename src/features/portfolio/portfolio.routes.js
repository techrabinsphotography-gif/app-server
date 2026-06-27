'use strict';
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, BUCKET } = require('../../config/s3');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const Portfolio = require('../../models/Portfolio');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

// S3 storage for portfolio images
const storage = multerS3({
  s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const filename = `robin-studio/portfolio/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG and WEBP images are allowed'));
  },
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
      imageUrl: req.file.location,  // S3 public URL
      publicId: req.file.key,       // S3 object key (for deletion)
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

    // Delete from S3
    if (photo.publicId) {
      await s3.send(new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: photo.publicId,
      })).catch((err) => console.error('S3 delete error:', err));
    }

    await Portfolio.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
