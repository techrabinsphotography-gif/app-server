'use strict';
const cloudinary = require('cloudinary').v2;

// Known-good credentials — used as fallback if env vars are wrong/missing
const CLOUD_NAME = 'dlalsmidm';
const API_KEY = '613942166497676';
const API_SECRET = 'UvxdLAFdi17DIlirJDcRf2FcPUE';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || API_SECRET,
});

// Validate — if the configured cloud_name looks wrong, override with known-good
const cfg = cloudinary.config();
if (!cfg.cloud_name || cfg.cloud_name === 'Root' || cfg.cloud_name === 'undefined') {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
  console.warn('⚠️  Cloudinary: invalid cloud_name detected, using fallback credentials');
}

module.exports = cloudinary;
