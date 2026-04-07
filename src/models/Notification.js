const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['general', 'promo', 'booking'], default: 'general' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: If null, it's global
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
