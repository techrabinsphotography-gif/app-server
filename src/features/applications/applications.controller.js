'use strict';
const JobApplication = require('../../models/JobApplication');
const CareerPost = require('../../models/CareerPost');
const { sendMail } = require('../../utils/mailer');

// ── PUBLIC: Submit application ────────────────────────────────────────────────
exports.submitApplication = async (req, res) => {
  const { careerId, name, email, phone, resumeUrl } = req.body;
  if (!careerId || !name || !email || !phone || !resumeUrl) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const career = await CareerPost.findById(careerId);
  if (!career || career.status !== 'OPEN') {
    return res.status(404).json({ success: false, message: 'Job posting not found or closed' });
  }

  const application = await JobApplication.create({
    careerId,
    careerTitle: career.title,
    name,
    email,
    phone,
    resumeUrl,
  });

  res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
};

// ── ADMIN: List all applications ──────────────────────────────────────────────
exports.listApplications = async (req, res) => {
  const { careerId } = req.query;
  const filter = careerId ? { careerId } : {};
  const applications = await JobApplication.find(filter)
    .populate('careerId', 'title department')
    .sort('-createdAt');
  res.json({ success: true, data: applications });
};

// ── ADMIN: Approve application → send email ───────────────────────────────────
exports.approveApplication = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'APPROVED';
  await app.save();

  // Send congratulations email
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #ff4f5a, #ff8c42); padding: 40px 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #111; font-size: 22px; margin: 0 0 12px; }
        .body p { color: #555; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .highlight { background: #fff5f5; border-left: 4px solid #ff4f5a; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; }
        .highlight p { margin: 0; color: #333; font-weight: 600; }
        .footer { background: #f9f9f9; padding: 24px 32px; text-align: center; border-top: 1px solid #eee; }
        .footer p { color: #999; font-size: 13px; margin: 0; }
        .logo { font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <div class="logo">✦ Rabin's Photography</div>
          <h1>Congratulations! 🎉</h1>
          <p>Your application has been approved</p>
        </div>
        <div class="body">
          <h2>Dear ${app.name},</h2>
          <p>We are thrilled to inform you that your application for the position of <strong>${app.careerTitle}</strong> at Rabin's Photography has been <strong>approved</strong>.</p>
          <div class="highlight">
            <p>🎯 Position: ${app.careerTitle}</p>
          </div>
          <p>Our team will be reaching out to you shortly with the next steps in the onboarding process. Please keep an eye on your inbox.</p>
          <p>We are excited to have you join our creative family and look forward to working with you!</p>
          <p>Warm regards,<br/><strong>The Rabin's Photography Team</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rabin's Photography · Kolkata, India</p>
          <p style="margin-top:6px;">rabinsphotography.com</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendMail(app.email, `Congratulations! Your application for ${app.careerTitle} is Approved`, html);

  res.json({ success: true, data: app, message: 'Application approved and email sent' });
};

// ── ADMIN: Reject application ─────────────────────────────────────────────────
exports.rejectApplication = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'REJECTED';
  await app.save();

  res.json({ success: true, data: app, message: 'Application rejected' });
};

// ── ADMIN: Proxy resume download (bypasses Cloudinary auth) ──────────────────
exports.getResumeSignedUrl = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  const https = require('https');
  const cloudinary = require('../../config/cloudinary');
  const cfg = cloudinary.config();
  const fileUrl = app.resumeUrl;

  const ext = fileUrl.split('.').pop().toLowerCase().split('?')[0];
  const contentTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  const contentType = contentTypes[ext] || 'application/octet-stream';
  const filename = `resume_${app.name.replace(/\s+/g, '_')}.${ext}`;

  // Build authenticated Cloudinary URL using API credentials
  const urlObj = new URL(fileUrl);
  const auth = Buffer.from(`${cfg.api_key}:${cfg.api_secret}`).toString('base64');

  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  };

  const proxyReq = https.request(options, (proxyRes) => {
    if (proxyRes.statusCode === 401 || proxyRes.statusCode === 403) {
      // Cloudinary doesn't accept basic auth for delivery — redirect as fallback
      return res.redirect(fileUrl);
    }
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', () => res.redirect(fileUrl));
  proxyReq.end();
};
exports.deleteApplication = async (req, res) => {
  await JobApplication.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Application deleted' });
};
