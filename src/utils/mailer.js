const nodemailer = require('nodemailer');
const https = require('https');

/**
 * Send an email via Brevo HTTP API (avoids SMTP port blocking)
 */
const sendMail = async (to, subject, html) => {
  const payload = JSON.stringify({
    sender: { name: 'Robin Studio', email: process.env.FROM_EMAIL || 'noreply@robinstudio.com' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Brevo API request timeout'));
    });
    req.write(payload);
    req.end();
  });
};

module.exports = { sendMail };
