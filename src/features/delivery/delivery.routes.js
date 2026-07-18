const { Router } = require('express');
const ctrl = require('./delivery.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// ── Admin routes (must be defined BEFORE /:bookingId wildcard) ───────────────
router.get('/', authenticate, authorize('ADMIN'), ctrl.listAllTracking);
router.get('/admin/:bookingId', authenticate, authorize('ADMIN'), ctrl.getAdminTracking);
router.post('/admin/:bookingId/stage', authenticate, authorize('ADMIN'), ctrl.updateStage);
router.put('/admin/:bookingId/order-items', authenticate, authorize('ADMIN'), ctrl.updateOrderItems);
router.post('/admin/:bookingId/media', authenticate, authorize('ADMIN'), ctrl.addMediaPreview);
router.delete('/admin/:bookingId/media/:previewId', authenticate, authorize('ADMIN'), ctrl.removeMediaPreview);
router.put('/admin/:bookingId/delivered', authenticate, authorize('ADMIN'), ctrl.markDelivered);

// ── User: get tracking info for their own booking ────────────────────────────
router.get('/:bookingId', authenticate, ctrl.getUserTracking);

// ── User: submit feedback ────────────────────────────────────────────────────
router.post('/:bookingId/feedback', authenticate, ctrl.submitFeedback);

module.exports = router;
