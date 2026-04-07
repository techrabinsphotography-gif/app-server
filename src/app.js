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
const uploadRoutes  = require('./features/upload/upload.routes');
const pricingRoutes = require('./features/pricing/pricing.routes');
const webRoutes    = require('./features/web/web.routes');

const createApp = () => {
  const app = express();

  // ── Security & Logging ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // ── Body Parsing ─────────────────────────────────────────────────────────────
  // NOTE: /api/v1/payments/webhook uses its own express.raw() — registered inside payments.routes.js
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── Health Check ─────────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV, timestamp: new Date().toISOString() });
  });

  // ── API Routes ───────────────────────────────────────────────────────────────
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/services', servicesRoutes);
  app.use('/api/v1/bookings', bookingsRoutes);
  app.use('/api/v1/payments', paymentsRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/profile', profileRoutes);
  app.use('/api/v1/admin', adminRoutes);
  app.use('/api/v1/upload',  uploadRoutes);
  app.use('/api/v1/pricing', pricingRoutes);
  app.use('/api/v1/web',     webRoutes);    // Web-site content (Team, Blog, CookiePolicy)

  // ── 404 Handler ──────────────────────────────────────────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
  });

  // ── Global Error Handler ─────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
