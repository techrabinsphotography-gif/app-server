const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    messageType: { type: String, enum: ['TEXT', 'IMAGE', 'FILE'], default: 'TEXT' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
