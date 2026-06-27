const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  homeSliders: [{
    imageUrl: { type: String, required: true },
    title: { type: String },
    link: { type: String }
  }],
  appDownloads: { type: Number, default: 0 },
  contactEmail: { type: String },
  contactPhone: { type: String },
  heroVideoUrl: { type: String, default: '' },
  bookingSectionImages: {
    image1: { type: String, default: '' },
    image2: { type: String, default: '' },
    image3: { type: String, default: '' },
  },
  blogSliderImages: {
    image1: { type: String, default: '' },
    image2: { type: String, default: '' },
    image3: { type: String, default: '' },
  },
  aboutImages: {
    heroBg: { type: String, default: '' },
    portrait: { type: String, default: '' },
    founder: { type: String, default: '' },
    heroVideo: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
