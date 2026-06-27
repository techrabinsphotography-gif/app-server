'use strict';
const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../../models/NewsletterSubscriber');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

// ── PUBLIC: Subscribe ─────────────────────────────────────────────────────────
router.post('/subscribe', async (req, res) => {
  const { email, source } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  try {
    await NewsletterSubscriber.create({ email, source: source || 'blog' });
    res.json({ success: true, message: 'Successfully subscribed to newsletter!' });
  } catch (err) {
    if (err.code === 11000) {
      // Already subscribed — still return success so user isn't confused
      return res.json({ success: true, message: 'You are already subscribed!' });
    }
    res.status(500).json({ success: false, message: 'Failed to subscribe. Please try again.' });
  }
});

// ── ADMIN: List all subscribers ───────────────────────────────────────────────
router.get('/subscribers', authenticate, authorize('ADMIN'), async (req, res) => {
  const subscribers = await NewsletterSubscriber.find().sort('-createdAt');
  res.json({ success: true, data: subscribers, total: subscribers.length });
});

// ── ADMIN: Delete a subscriber ────────────────────────────────────────────────
router.delete('/subscribers/:id', authenticate, authorize('ADMIN'), async (req, res) => {
  await NewsletterSubscriber.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Subscriber removed' });
});

module.exports = router;
