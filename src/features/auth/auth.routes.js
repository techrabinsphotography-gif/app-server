const { Router } = require('express');
const ctrl = require('./auth.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);
router.get('/verify-email/:token', ctrl.verifyEmail);

module.exports = router;
