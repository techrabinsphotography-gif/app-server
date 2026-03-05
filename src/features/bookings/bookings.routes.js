const { Router } = require('express');
const ctrl = require('./bookings.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// Admin routes (must be defined BEFORE /:id to avoid conflict)
router.get('/admin/all', authenticate, authorize('ADMIN'), ctrl.listAllBookings);
router.put('/admin/:id/status', authenticate, authorize('ADMIN'), ctrl.updateBookingStatus);

// Customer routes
router.get('/', authenticate, ctrl.listUserBookings);
router.post('/', authenticate, ctrl.createBooking);
router.get('/:id', authenticate, ctrl.getBookingById);
router.put('/:id/cancel', authenticate, ctrl.cancelBooking);

module.exports = router;
