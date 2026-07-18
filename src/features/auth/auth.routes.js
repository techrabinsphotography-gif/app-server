'use strict';
const { Router } = require('express');
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);
router.get('/verify-email/:token', ctrl.verifyEmail);
router.post('/send-otp', ctrl.sendOtp);
router.post('/verify-otp', ctrl.verifyOtp);

// ── Google OAuth  (POST /api/v1/auth/google) ──────────────────────────────────
// Body: { idToken: string }   ← idToken from GoogleSignin.signIn() on the app
router.post('/google', ctrl.googleAuth);

// ── Authenticated ─────────────────────────────────────────────────────────────
router.post('/logout', authenticate, ctrl.logout);

module.exports = router;
