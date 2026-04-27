'use strict';
const express = require('express');
const multer = require('multer');
const cloudinary = require('../../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'robin-studio/services',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

const router = express.Router();

// POST /api/v1/upload/image
router.post('/image', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('MULTER UPLOAD ERROR:', err);
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
    url: req.file.path,          // Cloudinary https URL
    publicId: req.file.filename, // Cloudinary public_id
  });
});

const resumeStorage = multer.memoryStorage();

const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/msword',                                                        // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
      'image/jpeg',                                                                // .jpg / .jpeg
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
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  // Stream buffer directly to Cloudinary
  const isImage = ['image/jpeg'].includes(req.file.mimetype);
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'robin-studio/resumes',
      resource_type: isImage ? 'image' : 'raw',
      access_mode: 'public',
      public_id: `resume_${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`,
    },
    (error, result) => {
      if (error) {
        console.error('CLOUDINARY RESUME ERROR:', error);
        return res.status(500).json({ success: false, message: error.message });
      }
      res.json({ success: true, url: result.secure_url, publicId: result.public_id });
    }
  );
  stream.end(req.file.buffer);
});

module.exports = router;
