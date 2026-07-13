const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema(
  {
    tier: { type: String, required: true },        // BRONZE, SILVER, GOLD or custom
    name: { type: String, required: true },
    price: { type: Number, required: true },        // flat price for the included base days
    features: { type: [String], default: [] },
    sessionHours: { type: Number, default: 0 },
    edited: { type: Number, default: 0 },

    // ── Day pricing (admin-controlled) ────────────────────────────
    // baseDays: days already included in the flat price
    //   BRONZE / SILVER default = 3, GOLD default = 4
    baseDays: { type: Number, default: 1, min: 1 },
    // extraDayPrice: cost per additional day beyond baseDays (set by admin)
    extraDayPrice: { type: Number, default: 0, min: 0 },

    // ── Razorpay payment button ───────────────────────────────────
    // Admin pastes the Razorpay Key ID (rzp_live_xxx / rzp_test_xxx) per package.
    // The app uses this key to open the Razorpay checkout for this specific package.
    razorpayKeyId: { type: String, default: '' },

    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoService', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Package', packageSchema);
