'use strict';
const mongoose = require('mongoose');

const newsletterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  source: { type: String, default: 'blog' }, // where they subscribed from
}, { timestamps: true });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSchema);
