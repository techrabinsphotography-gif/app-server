'use strict';

const express = require('express');
const router = express.Router();
const { sendMail } = require('../../utils/mailer');

// ── PUBLIC: Contact form submission ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, phone, email, message } = req.body || {};

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please fill in all fields' });
  }

  const htmlContent = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body>
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:10px;">
      <div style="background:linear-gradient(135deg,#ff4f5a,#ff8c42);padding:30px;border-radius:10px 10px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:24px;">New Contact Form Message</h1>
        <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px;">rabinsphotography.com</p>
      </div>
      <div style="background:#fff;padding:30px;border-radius:0 0 10px 10px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
            <p style="color:#6b7280;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Name</p>
            <p style="color:#111827;margin:4px 0 0;font-size:16px;font-weight:bold;">${name}</p>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
            <p style="color:#6b7280;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Email</p>
            <p style="color:#111827;margin:4px 0 0;font-size:16px;">
              <a href="mailto:${email}" style="color:#ff4f5a;text-decoration:none;">${email}</a>
            </p>
          </td></tr>
          <tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
            <p style="color:#6b7280;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Phone</p>
            <p style="color:#111827;margin:4px 0 0;font-size:16px;">
              <a href="tel:${phone}" style="color:#ff4f5a;text-decoration:none;">${phone}</a>
            </p>
          </td></tr>
          <tr><td style="padding:12px 0;">
            <p style="color:#6b7280;margin:0;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Message</p>
            <div style="background:#f9fafb;padding:14px;border-radius:8px;margin-top:8px;border-left:3px solid #ff4f5a;">
              <p style="color:#374151;margin:0;line-height:1.7;white-space:pre-wrap;">${message}</p>
            </div>
          </td></tr>
        </table>
        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;text-align:center;">
          Sent from rabinsphotography.com contact form
        </p>
      </div>
    </div></body></html>
  `;

  await sendMail(
    process.env.CONTACT_RECEIVER_EMAIL || 'rabinsphotography@gmail.com',
    `New Contact Message from ${name}`,
    htmlContent
  );

  return res.status(200).json({ success: true, message: 'Message sent successfully!' });
});

module.exports = router;
