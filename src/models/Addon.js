const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Addon', addonSchema);
