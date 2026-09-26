'use strict';
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { errorHandler } = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require('./features/auth/auth.routes');
const servicesRoutes = require('./features/services/services.routes');
const bookingsRoutes = require('./features/bookings/bookings.routes');
const paymentsRoutes = require('./features/payments/payments.routes');
const chatRoutes = require('./features/chat/chat.routes');
const profileRoutes = require('./features/profile/profile.routes');
const adminRoutes = require('./features/admin/admin.routes');
const uploadRoutes = require('./features/upload/upload.routes');
const pricingRoutes = require('./features/pricing/pricing.routes');
const webRoutes = require('./features/web/web.routes');
const applicationRoutes = require('./features/applications/applications.routes');
const portfolioRoutes = require('./features/portfolio/portfolio.routes');
const newsletterRoutes = require('./features/newsletter/newsletter.routes');
const deliveryRoutes = require('./features/delivery/delivery.routes');
const notificationsRoutes = require('./features/notifications/notifications.routes');
const contactRoutes = require('./features/contact/contact.routes');

const createApp = () => {
  const app = express();

  // ── Security & Logging ──────────────────────────────────────────────────────
  // CORS must be registered BEFORE helmet so preflight OPTIONS requests
  // are handled correctly and not blocked by helmet's security headers.
  //
  // PERMISSIVE CORS: Dynamically reflect the request Origin header.
  // This avoids repeated breakage every time a new frontend domain is
  // deployed (e.g. nozzearte.in, rabin-admin.vercel.app, etc.).
  // credentials=true MUST be paired with a specific origin (never "*"),
  // so echoing back the origin is the safest permissive approach.

  const corsOptions = {
    origin: (origin, callback) => {
      callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Referer',
      'User-Agent',
      'Cache-Control',
      'x-amz-date',
      'x-amz-security-token',
    ],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'ETag',
    ],
    maxAge: 86400,
    optionsSuccessStatus: 200,
  };

  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Body Parsing ─────────────────────────────────────────────────────────────
  // NOTE: /api/v1/payments/webhook uses its own express.raw() — registered inside payments.routes.js
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Keep-alive ping (prevents Render free tier from sleeping) ────────────────
  // Use dynamic self-URL so it works regardless of deployment domain
  const SELF_URL = process.env.SELF_URL || 'https://app-server-maaw.onrender.com';
  setInterval(async () => {
    try {
      await fetch(`${SELF_URL}/health`);
    } catch (_) { }
  }, 14 * 60 * 1000); // every 14 minutes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // ── Debug: test Brevo API from server ───────────────────────────────────────
  app.get('/debug-brevo', async (req, res) => {
    try {
      const { sendMail } = require('./utils/mailer');
      await sendMail('suddhajit2@gmail.com', 'Test OTP Email', '<p>Test from Render - Brevo API working!</p>');
      res.json({ status: 'sent', apiKey: process.env.BREVO_API_KEY ? 'set' : 'MISSING' });
    } catch (e) {
      res.json({ status: 'failed', error: e.message, apiKey: process.env.BREVO_API_KEY ? 'set' : 'MISSING' });
    }
  });

  // ── API Routes ───────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/services', servicesRoutes);
  app.use('/api/v1/bookings', bookingsRoutes);
  app.use('/api/v1/payments', paymentsRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/upload', uploadRoutes);
  app.use('/api/v1/pricing', pricingRoutes);
  app.use('/api/v1/web', webRoutes);    // Web-site content (Team, Blog, CookiePolicy)
  app.use('/api/v1/applications', applicationRoutes);
  app.use('/api/v1/portfolio', portfolioRoutes);
  app.use('/api/v1/newsletter', newsletterRoutes);
  app.use('/api/v1/delivery', deliveryRoutes);
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/contact', contactRoutes);

  // ── 404 Handler ──────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
