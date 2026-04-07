'use strict';
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  excerpt: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    default: 'Rabin Das',
    trim: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Wedding', 'Portrait', 'Events', 'Tips & Tricks', 'Behind the Scenes', 'Other'],
    default: 'Other',
  },
  coverImage: {
    type: String,
    default: '',
  },
  readTime: {
    type: String,
    default: '5 min read',
  },
  published: {
    type: Boolean,
    default: false,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
}, { timestamps: true });

// Auto-generate slug from title before saving
blogPostSchema.pre('save', function (next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);
  }
  next();
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
