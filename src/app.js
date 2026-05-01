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

const createApp = () => {
  const app = express();

  // ── Security & Logging ──────────────────────────────────────────────────────
  // CORS must be registered BEFORE helmet so preflight OPTIONS requests
  // are handled correctly and not blocked by helmet's security headers.

  // Build the allowed-origins list from env (trimmed, no empties)
  // Production origins are always included so the server works even if
  // ALLOWED_ORIGINS env var is missing or only has dev origins.
  const PRODUCTION_ORIGINS = [
    'https://rabin-admin.vercel.app',
    'https://rabinsphotography.com',
    'https://www.rabinsphotography.com',
  ];

  const _envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Always merge env origins with production origins (deduped)
  const _allowedOrigins = [...new Set([..._envOrigins, ...PRODUCTION_ORIGINS])];

  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (_allowedOrigins.includes('*')) return callback(null, origin);
      if (_allowedOrigins.includes(origin)) return callback(null, origin);
      // In development or if list is somehow empty, allow all
      if (_allowedOrigins.length === 0) return callback(null, origin);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
  };

  // Handle preflight for ALL routes
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
  setInterval(async () => {
    try {
      await fetch('https://app-server-maaw.onrender.com/health');
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
  app.use('/api/v1/applications', applicationRoutes); // Job applications

  // ── 404 Handler ──────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
