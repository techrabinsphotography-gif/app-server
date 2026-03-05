const mongoose = require('mongoose');

const photoServiceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: String, enum: ['WEDDING', 'PORTRAIT', 'EVENT', 'CORPORATE', 'OTHER'], required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhotoService', photoServiceSchema);
