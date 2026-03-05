const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    tier: { type: String, enum: ['BRONZE', 'SILVER', 'GOLD'], required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: { type: [String], default: [] },
    sessionHours: { type: Number, required: true },
    edited: { type: Number, required: true }, // number of edited photos included
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoService', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
