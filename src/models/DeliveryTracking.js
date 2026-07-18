const mongoose = require('mongoose');

/**
 * DeliveryTracking — admin-managed delivery progress for an approved booking.
 *
 * Stages (admin sets manually): e.g. "Editing in Progress", "Photos Ready", etc.
 * Media previews: image/video preview links with an optional validity period.
 *   - while validity window is active the link is served to the user
 *   - after expiry the link is hidden from the user (admin can still see it)
 */

const mediaPreviewSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },          // direct URL (image) or embed/drive link (video)
    type: { type: String, enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' },
    caption: { type: String, default: '' },
    // Validity window — if null the preview is always visible
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
  },
  { _id: true, timestamps: false }
);

const trackingStageSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true, trim: true }, // e.g. "Photos Edited", "Album Ready"
    note: { type: String, default: '' },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: true, timestamps: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: '' },             // e.g. "prints", "albums", "clips"
    description: { type: String, default: '' },
  },
  { _id: true, timestamps: false }
);

const deliveryTrackingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,  // one tracking record per booking
    },

    // ── Current status message (latest stage summary) ──────────────
    currentStage: { type: String, default: '' },     // free-text shown prominently to user

    // ── Stage history (append-only timeline) ──────────────────────
    stages: { type: [trackingStageSchema], default: [] },

    // ── Ordered product / deliverable list ────────────────────────
    orderItems: { type: [orderItemSchema], default: [] },

    // ── Media previews (images & video links) ─────────────────────
    mediaPreviews: { type: [mediaPreviewSchema], default: [] },

    // ── Final delivery flag ────────────────────────────────────────
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema);
