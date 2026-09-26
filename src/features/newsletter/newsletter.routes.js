'use strict';
const express = require('express');
const router = express.Router();
const NewsletterSubscriber = require('../../models/NewsletterSubscriber');
const { sendMail } = require('../../utils/mailer');
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

    // Send welcome email via Brevo (fire & forget — never block the response)
    const welcomeHtml = `
      <!DOCTYPE html><html><head><meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width,initial-scale=1"/>
      </head><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <div style="background:linear-gradient(135deg,#ff4f5a,#ff8c42);padding:40px 32px;text-align:center;">
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;">Welcome to Rabin's Photography! 📸</h1>
          <p style="margin:12px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">You're now part of our creative community.</p>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#555;line-height:1.7;">
            Thank you for subscribing! Every time we publish a new article — photography tips, behind-the-scenes stories, wedding guides, and more — you'll be the first to know with a direct link to the post.
          </p>
          <a href="${process.env.SITE_URL || 'https://www.rabinsphotography.com'}/blog"
             style="display:inline-block;background:linear-gradient(135deg,#ff4f5a,#ff8c42);color:#fff;text-decoration:none;padding:14px 28px;border-radius:30px;font-size:15px;font-weight:700;">
            Browse Latest Articles →
          </a>
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
          <p style="margin:0;font-size:13px;color:#aaa;text-align:center;">
            Rabin's Photography · Kolkata, India<br/>
            <a href="${process.env.SITE_URL || 'https://www.rabinsphotography.com'}" style="color:#ff4f5a;text-decoration:none;">rabinsphotography.com</a>
          </p>
        </div>
      </div>
      </body></html>
    `;
    sendMail(email, "Welcome to Rabin's Photography Newsletter 📸", welcomeHtml).catch(err =>
      console.error('[newsletter] Welcome email failed:', err.message)
    );

    res.json({ success: true, message: 'Successfully subscribed to newsletter!' });
  } catch (err) {
    if (err.code === 11000) {
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
