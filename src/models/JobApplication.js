'use strict';
const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  careerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CareerPost',
    required: true,
  },
  careerTitle: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  resumeUrl: { type: String, required: true },
  resumePublicId: { type: String, default: '' }, // S3 object key for secure download
  status: {
    type: String,
    enum: ['PENDING', 'SHORTLISTED', 'REJECTED', 'INTERVIEW_SCHEDULED'],
    default: 'PENDING',
  },
  interviewDate: { type: String, default: '' },   // e.g. "2026-07-15"
  interviewTime: { type: String, default: '' },   // e.g. "11:00 AM"
  interviewLocation: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
