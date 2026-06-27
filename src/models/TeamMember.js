'use strict';
const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  tier: {
    type: String,
    enum: ['BACKBONE', 'CREW', 'CORE'],
    required: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  bio: {
    type: String,
    default: '',
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
