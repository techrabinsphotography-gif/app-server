const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,  // 10s to connect
  greetingTimeout: 10000,    // 10s for greeting
  socketTimeout: 15000,      // 15s for socket
});

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 */
const sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Robin Studio" <${process.env.FROM_EMAIL}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendMail };
