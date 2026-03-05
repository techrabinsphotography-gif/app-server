const { Router } = require('express');
const express = require('express');
const ctrl = require('./payments.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// Webhook needs raw body — must be registered before express.json() strips it
router.post('/webhook', express.raw({ type: 'application/json' }), ctrl.handleWebhook);

router.post('/create-order', authenticate, ctrl.createOrder);
router.post('/verify', authenticate, ctrl.verifyPayment);
router.get('/:bookingId', authenticate, ctrl.getPayment);
router.post('/:id/refund', authenticate, authorize('ADMIN'), ctrl.refundPayment);

module.exports = router;
