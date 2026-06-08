const mongoose = require('mongoose');

const addonSnapshotSchema = new mongoose.Schema({
  addonId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: false });

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoService', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },

    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },

    // ── Schedule ─────────────────────────────────────────────────────
    scheduledDate: { type: Date, required: true },          // session start date
    scheduledTime: { type: String, default: '' },             // e.g. "10:00 AM"
    outTime: { type: String, default: '' },             // e.g. "2:00 PM"

    // ── Extra hours beyond base package ──────────────────────────────
    extraHours: { type: Number, default: 0, min: 0 },     // integer hours
    extraHourRate: { type: Number, default: 1000 },           // ₹ per extra hour

    // ── Multi-day support ────────────────────────────────────────────
    additionalDates: [{ type: String }],                       // ISO date strings for extra days

    // ── Venue & notes ────────────────────────────────────────────────
    venue: { type: String, default: '' },
    specialNotes: { type: String, default: '' },

    // ── Add-ons snapshot (denormalised for receipts) ─────────────────
    addons: { type: [addonSnapshotSchema], default: [] },

    // ── Pricing breakdown ────────────────────────────────────────────
    baseAmount: { type: Number, required: true },   // pkg.price × numDays
    addonsAmount: { type: Number, default: 0 },       // sum of addon prices
    extraAmount: { type: Number, default: 0 },       // extraHours × extraHourRate
    taxAmount: { type: Number, default: 0 },       // 8% of pre-tax total
    totalAmount: { type: Number, required: true },   // final charged amount
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
