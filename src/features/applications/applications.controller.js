'use strict';
const JobApplication = require('../../models/JobApplication');
const CareerPost = require('../../models/CareerPost');
const { sendMail } = require('../../utils/mailer');

// ── PUBLIC: Submit application ────────────────────────────────────────────────
exports.submitApplication = async (req, res) => {
  const { careerId, name, email, phone, resumeUrl, resumePublicId } = req.body;
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
    resumePublicId: resumePublicId || '',
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

// ── ADMIN: Shortlist application (no email sent) ──────────────────────────────
exports.approveApplication = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'SHORTLISTED';
  await app.save();

  res.json({ success: true, data: app, message: 'Application shortlisted' });
};

// ── ADMIN: Schedule interview → send email to candidate ───────────────────────
exports.scheduleInterview = async (req, res) => {
  const { interviewDate, interviewTime, interviewLocation } = req.body;

  if (!interviewDate || !interviewTime) {
    return res.status(400).json({ success: false, message: 'Interview date and time are required' });
  }

  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'INTERVIEW_SCHEDULED';
  app.interviewDate = interviewDate;
  app.interviewTime = interviewTime;
  app.interviewLocation = interviewLocation || "Rabin's Photography Studio, Kolkata";
  await app.save();

  const formattedDate = new Date(interviewDate).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const html = `
    <!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
      .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
      .header{background:linear-gradient(135deg,#ff4f5a,#ff8c42);padding:40px 32px;text-align:center}
      .header h1{color:#fff;margin:0;font-size:26px;font-weight:800}
      .header p{color:rgba(255,255,255,.85);margin:8px 0 0;font-size:15px}
      .body{padding:40px 32px}
      .body h2{color:#111;font-size:20px;margin:0 0 12px}
      .body p{color:#555;font-size:15px;line-height:1.7;margin:0 0 16px}
      .card{background:#fff8f0;border:1.5px solid #ff8c42;border-radius:12px;padding:24px;margin:24px 0}
      .row{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px}
      .row:last-child{margin-bottom:0}
      .icon{font-size:20px;flex-shrink:0}
      .lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#ff8c42;margin-bottom:2px}
      .val{font-size:16px;font-weight:700;color:#111}
      .note{background:#f9f9f9;border-left:4px solid #ff4f5a;padding:16px 20px;border-radius:0 8px 8px 0;margin:24px 0}
      .footer{background:#f9f9f9;padding:24px 32px;text-align:center;border-top:1px solid #eee}
      .footer p{color:#999;font-size:13px;margin:0}
      .logo{font-size:18px;font-weight:900;color:#fff}
    </style></head><body>
    <div class="wrapper">
      <div class="header">
        <div class="logo">✦ Rabin's Photography</div>
        <h1>Interview Scheduled 🗓️</h1>
        <p>You've been shortlisted for an interview</p>
      </div>
      <div class="body">
        <h2>Dear ${app.name},</h2>
        <p>Congratulations! You have been <strong>shortlisted</strong> for the position of <strong>${app.careerTitle}</strong> at Rabin's Photography. Your interview has been scheduled:</p>
        <div class="card">
          <div class="row"><div class="icon">💼</div><div><div class="lbl">Position</div><div class="val">${app.careerTitle}</div></div></div>
          <div class="row"><div class="icon">📅</div><div><div class="lbl">Date</div><div class="val">${formattedDate}</div></div></div>
          <div class="row"><div class="icon">🕐</div><div><div class="lbl">Time</div><div class="val">${app.interviewTime}</div></div></div>
          <div class="row"><div class="icon">📍</div><div><div class="lbl">Location</div><div class="val">${app.interviewLocation}</div></div></div>
        </div>
        <div class="note"><p>📌 Please arrive 10 minutes early and carry a copy of your resume and any relevant portfolio work.</p></div>
        <p>If you have any questions or need to reschedule, please reply to this email immediately.</p>
        <p>We look forward to meeting you!</p>
        <p>Warm regards,<br/><strong>The Rabin's Photography Team</strong></p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Rabin's Photography · Kolkata, India</p>
        <p style="margin-top:6px;">rabinsphotography.com</p>
      </div>
    </div></body></html>
  `;

  await sendMail(app.email, `Interview Scheduled — ${app.careerTitle} at Rabin's Photography`, html);
  res.json({ success: true, data: app, message: 'Interview scheduled and email sent' });
};

// ── ADMIN: Reject application ─────────────────────────────────────────────────
exports.rejectApplication = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  app.status = 'REJECTED';
  await app.save();

  res.json({ success: true, data: app, message: 'Application rejected' });
};

// ── ADMIN: Generate pre-signed S3 URL for resume download ────────────────────
exports.getResumeSignedUrl = async (req, res) => {
  const app = await JobApplication.findById(req.params.id);
  if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

  const { s3, BUCKET } = require('../../config/s3');
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

  // Derive S3 key — prefer stored publicId, fall back to extracting from URL
  let key = app.resumePublicId;
  if (!key && app.resumeUrl) {
    const match = app.resumeUrl.match(/amazonaws\.com\/(.+)$/);
    key = match ? match[1] : null;
  }

  if (!key) {
    return res.status(400).json({ success: false, message: 'Resume key not found' });
  }

  const ext = key.split('.').pop().toLowerCase() || 'pdf';
  const filename = `resume_${app.name.replace(/\s+/g, '_')}.${ext}`;

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    });

    // Pre-signed URL valid for 5 minutes
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ success: true, url: signedUrl, filename, ext });
  } catch (err) {
    console.error('S3 pre-sign error:', err);
    res.status(500).json({ success: false, message: 'Could not generate download link' });
  }
};

// ── ADMIN: Delete application ─────────────────────────────────────────────────
exports.deleteApplication = async (req, res) => {
  await JobApplication.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Application deleted' });
};
