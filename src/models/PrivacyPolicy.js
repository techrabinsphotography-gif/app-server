'use strict';
const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema({
  title:   { type: String, required: true },
  content: { type: String, required: true },
}, { _id: false });

const privacyPolicySchema = new mongoose.Schema({
  sections:    { type: [sectionSchema], default: [] },
  effectiveDate: { type: String, default: 'February 2026' },
  lastUpdated:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('PrivacyPolicy', privacyPolicySchema);
