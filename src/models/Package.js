const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    tier:         { type: String, required: true },        // e.g. BRONZE, SILVER, GOLD or custom
    name:         { type: String, required: true },
    price:        { type: Number, required: true },
    features:     { type: [String], default: [] },
    sessionHours: { type: Number, default: 0 },
    edited:       { type: Number, default: 0 },
    serviceId:    { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoService', required: true },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
