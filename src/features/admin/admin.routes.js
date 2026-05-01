const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const { getDashboardStats, updateSettings, getSettings, createCoupon, getCoupons, deleteCoupon, sendNotification, getNotifications, getUsers, getBookings, getPayments } = require('./admin.controller');

const router = express.Router();

// Public admin info
router.get('/settings', getSettings);

// Public coupon validation (no auth needed — app users validate coupons)
router.post('/coupons/validate', async (req, res) => {
  try {
    const Coupon = require('../../models/Coupon');
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    const coupon = await Coupon.findOne({
      code: code.toUpperCase().trim(),
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });

    res.json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

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
