'use strict';
const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  publicId: { type: String, required: true }, // Cloudinary public_id for deletion
  caption: { type: String, default: '' },
  category: { type: String, default: 'General' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
