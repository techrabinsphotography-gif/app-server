'use strict';
const mongoose = require('mongoose');

const careerPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    default: 'Kolkata, India',
    trim: true,
  },
  type: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'],
    default: 'Full-time',
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN',
  },
}, { timestamps: true });

module.exports = mongoose.model('CareerPost', careerPostSchema);
