const mongoose = require('mongoose');

const mediaPreviewSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' },
    caption: { type: String, default: '' },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
  },
  { _id: true, timestamps: false }
);

const trackingStageSchema = new mongoose.Schema(
  {
    stage: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
    completedAt: { type: Date, default: Date.now },
    // Optional input fields admin wants from the user for this stage
    userInputFields: {
      type: [{
        label: { type: String, required: true },
        type: { type: String, enum: ['text', 'link'], default: 'text' },
        placeholder: { type: String, default: '' },
        required: { type: Boolean, default: false },
        userResponse: { type: String, default: '' },
        respondedAt: { type: Date, default: null },
      }],
      default: [],
    },
  },
  { _id: true, timestamps: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: true, timestamps: false }
);

// ── User feedback schema ─────────────────────────────────────────────────────
const feedbackSchema = new mongoose.Schema(
  {
    rating: { type: Number, min: 1, max: 5, default: null }, // 1-5 stars
    comment: { type: String, default: '' },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const deliveryTrackingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
    },
    currentStage: { type: String, default: '' },
    stages: { type: [trackingStageSchema], default: [] },
    orderItems: { type: [orderItemSchema], default: [] },
    mediaPreviews: { type: [mediaPreviewSchema], default: [] },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },

    // ── User feedback (submitted after delivery) ─────────────────
    feedback: { type: feedbackSchema, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema);
