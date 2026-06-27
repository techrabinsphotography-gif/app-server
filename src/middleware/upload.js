'use strict';
const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3, BUCKET } = require('../config/s3');

const storage = multerS3({
  s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const filename = `robin-studio/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG and WEBP images are allowed'));
  },
});

module.exports = { upload };
