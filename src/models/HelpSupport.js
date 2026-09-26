'use strict';
const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
}, { _id: false });

const helpSupportSchema = new mongoose.Schema({
  faqs:       { type: [faqSchema], default: [] },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HelpSupport', helpSupportSchema);
