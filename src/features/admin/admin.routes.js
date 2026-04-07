const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { getDashboardStats, updateSettings, getSettings, createCoupon, getCoupons, deleteCoupon, sendNotification, getNotifications, getUsers, getBookings, getPayments } = require('./admin.controller');

const router = express.Router();

// Public admin info
router.get('/settings', getSettings);

// Require valid JWT and ADMIN role for all routes below
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', getDashboardStats);
router.put('/settings', updateSettings);

router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.delete('/coupons/:id', deleteCoupon);

router.post('/notifications', sendNotification);
router.get('/notifications', getNotifications);
router.get('/users', getUsers);
router.get('/bookings', getBookings);
router.get('/payments', getPayments);

module.exports = router;
