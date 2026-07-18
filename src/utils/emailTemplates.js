/**
 * Beautiful HTML email templates for Rabin's Photography
 * Uses inline CSS for maximum email client compatibility.
 */

const BRAND = {
  primary: '#FF8E3C',
  dark: '#0d0d0d',
  card: '#1a1a1a',
  border: '#2a2a2a',
  text: '#e0e0e0',
  muted: '#888888',
  success: '#4ade80',
  danger: '#f87171',
  // Logo hosted on production website — always publicly accessible
  logoUrl: 'https://rabinsphotography.com/browser-logo.png',
};

// ─── Base layout wrapper ───────────────────────────────────────────────────
const baseTemplate = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Rabin's Photography</title>
</head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Header / Logo ── -->
          <tr>
            <td align="center" style="padding:0 0 32px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a0d0e,#2a1510);border-radius:20px;padding:24px 40px;text-align:center;border:1px solid #3a2010;">
                    <div style="display:inline-block;width:44px;height:44px;background:#FF8E3C;border-radius:50%;text-align:center;line-height:44px;font-size:22px;margin-bottom:10px;">✦</div>
                    <div style="color:#FF8E3C;font-size:24px;font-weight:800;letter-spacing:1px;margin-bottom:2px;">Rabin's Photography</div>
                    <div style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Professional Photography Studio</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body Card ── -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:20px;border:1px solid #2a2a2a;overflow:hidden;">
                ${bodyContent}
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td align="center" style="padding:32px 0 0 0;">
              <div style="color:#555;font-size:12px;line-height:1.8;">
                © ${new Date().getFullYear()} Rabin's Photography Studio · All rights reserved<br/>
                <span style="color:#3a3a3a;">If you have questions, reply to this email or use the Help &amp; Support chat in the app.</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Divider helper ───────────────────────────────────────────────────────
const divider = () => `
  <tr>
    <td style="padding:0 32px;">
      <div style="height:1px;background:#2a2a2a;"></div>
    </td>
  </tr>`;

// ─── Data row helper ──────────────────────────────────────────────────────
const dataRow = (label, value, valueColor = '#e0e0e0') => `
  <tr>
    <td style="padding:8px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color:#888;font-size:13px;width:40%;">${label}</td>
          <td style="color:${valueColor};font-size:14px;font-weight:600;text-align:right;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>`;

// ══════════════════════════════════════════════════════════════════════════════
// 1. BOOKING CONFIRMATION (sent on admin APPROVE)
// ══════════════════════════════════════════════════════════════════════════════
const bookingConfirmationEmail = ({
  customerName,
  orderId,
  packageName,
  serviceName,
  scheduledDate,
  scheduledTime,
  venue,
  totalAmount,
  addons = [],
}) => {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const dateStr = scheduledDate
    ? new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const body = `
    <!-- ── Hero ── -->
    <tr>
      <td style="background:linear-gradient(135deg,#1a1a1a,#2a1510);padding:40px 32px;text-align:center;border-bottom:1px solid #2a2a2a;">
        <div style="width:72px;height:72px;background:rgba(74,222,128,0.15);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(74,222,128,0.4);">
          <span style="font-size:36px;">✓</span>
        </div>
        <h1 style="color:#4ade80;margin:0 0 8px;font-size:26px;font-weight:800;">Booking Confirmed!</h1>
        <p style="color:#aaa;margin:0;font-size:14px;">Your photography session has been approved and confirmed.</p>
      </td>
    </tr>

    <!-- ── Greeting ── -->
    <tr>
      <td style="padding:32px 32px 16px;">
        <p style="color:#e0e0e0;font-size:15px;margin:0;line-height:1.7;">
          Hi <strong style="color:#FF8E3C;">${customerName}</strong>,
        </p>
        <p style="color:#aaa;font-size:14px;margin:12px 0 0;line-height:1.7;">
          Wonderful news! Your booking has been approved. We're excited to capture your special moments.
          Here are the confirmed details:
        </p>
      </td>
    </tr>

    <!-- ── Order ID highlight ── -->
    <tr>
      <td style="padding:8px 32px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,142,60,0.08);border:1px solid rgba(255,142,60,0.3);border-radius:12px;padding:16px 20px;">
          <tr>
            <td>
              <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">Order Reference</div>
              <div style="color:#FF8E3C;font-size:22px;font-weight:800;letter-spacing:2px;font-family:monospace;">#${orderId}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${divider()}

    <!-- ── Booking Details ── -->
    <tr>
      <td style="padding:24px 32px;">
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Session Details</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${dataRow('📸 Service', serviceName || '—')}
          ${dataRow('📦 Package', packageName || '—', '#FF8E3C')}
          ${dataRow('📅 Date', dateStr)}
          ${dataRow('🕐 Time', scheduledTime || '—')}
          ${dataRow('📍 Venue', venue || 'To be confirmed')}
        </table>
      </td>
    </tr>

    ${divider()}

    <!-- ── Payment Summary ── -->
    <tr>
      <td style="padding:24px 32px;">
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">Payment Summary</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${addons.map(a => dataRow(`  • ${a.name}`, fmt(a.price))).join('')}
          <tr>
            <td style="padding:12px 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,142,60,0.06);border-top:1px solid rgba(255,142,60,0.3);padding:12px 0 0;">
                <tr>
                  <td style="color:#e0e0e0;font-size:15px;font-weight:700;">Total Amount Paid</td>
                  <td style="color:#FF8E3C;font-size:22px;font-weight:800;text-align:right;">${fmt(totalAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${divider()}

    <!-- ── Next Steps ── -->
    <tr>
      <td style="padding:24px 32px;">
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:16px;">What happens next?</div>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[
      ['📱', 'Track Progress', 'Open the app → My Bookings → Delivery Tracking to follow your session progress.'],
      ['🖼️', 'Preview Access', 'We\'ll upload preview images for you to see before final delivery.'],
      ['📬', 'Final Delivery', 'You\'ll be notified when all your photos & videos are ready.'],
    ].map(([icon, title, desc]) => `
          <tr>
            <td style="padding:8px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:40px;vertical-align:top;padding-top:2px;font-size:18px;">${icon}</td>
                  <td style="vertical-align:top;">
                    <div style="color:#e0e0e0;font-size:13px;font-weight:700;margin-bottom:2px;">${title}</div>
                    <div style="color:#888;font-size:12px;line-height:1.6;">${desc}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`).join('')}
        </table>
      </td>
    </tr>

    <!-- ── CTA ── -->
    <tr>
      <td style="padding:8px 32px 40px;text-align:center;">
        <div style="color:#555;font-size:12px;margin-top:16px;">
          Questions? Use <strong style="color:#FF8E3C;">Help &amp; Support</strong> in the app or reply to this email.
        </div>
      </td>
    </tr>
  `;

  return baseTemplate(body);
};

// ══════════════════════════════════════════════════════════════════════════════
// 2. BOOKING REJECTED EMAIL
// ══════════════════════════════════════════════════════════════════════════════
const bookingRejectedEmail = ({ customerName, orderId, packageName, adminNote }) => {
  const body = `
    <tr>
      <td style="background:linear-gradient(135deg,#1a1a1a,#2a1010);padding:40px 32px;text-align:center;border-bottom:1px solid #2a2a2a;">
        <div style="font-size:48px;margin-bottom:16px;">✗</div>
        <h1 style="color:#f87171;margin:0 0 8px;font-size:24px;font-weight:800;">Booking Not Approved</h1>
        <p style="color:#aaa;margin:0;font-size:14px;">We're sorry, but your booking could not be confirmed at this time.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="color:#e0e0e0;font-size:15px;margin:0 0 12px;">Hi <strong style="color:#FF8E3C;">${customerName}</strong>,</p>
        <p style="color:#aaa;font-size:14px;margin:0 0 24px;line-height:1.7;">
          Unfortunately, booking <strong style="color:#FF8E3C;font-family:monospace;">#${orderId}</strong>
          for <strong style="color:#e0e0e0;">${packageName}</strong> could not be approved.
        </p>
        ${adminNote ? `
        <div style="background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.25);border-radius:12px;padding:16px 20px;margin-bottom:24px;">
          <div style="color:#f87171;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Reason</div>
          <div style="color:#e0e0e0;font-size:14px;line-height:1.6;">${adminNote}</div>
        </div>` : ''}
        <p style="color:#aaa;font-size:14px;margin:0;line-height:1.7;">
          A full refund will be processed within 5–7 business days if payment was made.
          If you have any questions, please use <strong style="color:#FF8E3C;">Help &amp; Support</strong> in the app.
        </p>
      </td>
    </tr>
  `;
  return baseTemplate(body);
};

module.exports = { bookingConfirmationEmail, bookingRejectedEmail };
