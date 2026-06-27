'use strict';
const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, BUCKET } = require('../../config/s3');
const { PutObjectCommand } = require('@aws-sdk/client-s3');

const router = express.Router();

// ── Image upload (service images) ────────────────────────────────────────────
const imageStorage = multerS3({
  s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const filename = `robin-studio/services/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, filename);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG and WEBP images are allowed'));
  },
});

// POST /api/v1/upload/image
router.post('/image', (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      console.error('IMAGE UPLOAD ERROR:', err);
      return res.status(500).json({ success: false, message: err.message || JSON.stringify(err) });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    url: req.file.location,   // S3 public HTTPS URL
    publicId: req.file.key,   // S3 object key (used for deletion)
  });
});

// ── Resume upload (private — stored in robin-studio/resumes/) ─────────────────
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
    ];
    const allowedExts = ['.doc', '.docx', '.jpg', '.jpeg'];
    const ext = '.' + file.originalname.split('.').pop().toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
      return cb(null, true);
    }
    cb(new Error('Only DOC, DOCX, JPG, and JPEG files are allowed'));
  },
});

// POST /api/v1/upload/resume
router.post('/resume', (req, res, next) => {
  resumeUpload.single('resume')(req, res, (err) => {
    if (err) {
      console.error('RESUME UPLOAD ERROR:', err);
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const key = `robin-studio/resumes/resume_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }));

    const url = `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;
    res.json({ success: true, url, publicId: key });
  } catch (err) {
    console.error('S3 RESUME UPLOAD ERROR:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Video upload (hero video) ─────────────────────────────────────────────────
const videoStorage = multerS3({
  s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const filename = `robin-studio/videos/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, filename);
  },
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only MP4, WebM and MOV videos are allowed'));
  },
});

// POST /api/v1/upload/video
router.post('/video', (req, res, next) => {
  videoUpload.single('video')(req, res, (err) => {
    if (err) {
      console.error('VIDEO UPLOAD ERROR:', err);
      return res.status(500).json({ success: false, message: err.message || JSON.stringify(err) });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({
    success: true,
    url: req.file.location,
    publicId: req.file.key,
  });
});

module.exports = router;
