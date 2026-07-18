const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['general', 'promo', 'service', 'booking', 'discount'],
    default: 'general',
  },
  // null → broadcast to all users; ObjectId → targeted to one user
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  imageUrl: { type: String, default: null },
  actionUrl: { type: String, default: null }, // deep-link / screen path
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Index for fast per-user + global queries
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
