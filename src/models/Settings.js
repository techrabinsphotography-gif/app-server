const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  homeSliders: [{
    imageUrl: { type: String, required: true },
    title: { type: String },
    link: { type: String }
  }],
  appDownloads: { type: Number, default: 0 },
  contactEmail: { type: String },
  contactPhone: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
