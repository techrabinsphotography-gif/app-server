'use strict';
const mongoose = require('mongoose');

const cookiePolicySchema = new mongoose.Schema({
  sections: [
    {
      title: { type: String, required: true },
      content: { type: String, required: true },
    }
  ],
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('CookiePolicy', cookiePolicySchema);
