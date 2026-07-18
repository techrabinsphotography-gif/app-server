'use strict';
const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Settings = require('../../models/Settings');
const Coupon = require('../../models/Coupon');
const Notification = require('../../models/Notification');
const notifSvc = require('../../utils/notificationService');

exports.getDashboardStats = async (req, res) => {
  const usersCount = await User.countDocuments({ role: 'CUSTOMER' });
  const bookingsCount = await Booking.countDocuments();
  const successfulPayments = await Payment.countDocuments({ paymentStatus: 'completed' });
  const settings = await Settings.findOne();

  res.json({
    success: true,
    data: {
      users: usersCount,
      bookings: bookingsCount,
      payments: successfulPayments,
      appDownloads: settings?.appDownloads || 0,
    },
  });
};

exports.getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json({ success: true, data: settings });
};

exports.updateSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings(req.body);
  } else {
    Object.assign(settings, req.body);
  }
  await settings.save();
  res.json({ success: true, data: settings });
};

// ── Coupons ───────────────────────────────────────────────────────────────────
exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.json({ success: true, data: coupon });

  // ── Auto-notify all users about the new discount ─────────────────────────
  const discountText = coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% OFF`
    : `₹${Number(coupon.discountValue).toLocaleString('en-IN')} OFF`;

  const expiry = coupon.validUntil
    ? ` Valid until ${new Date(coupon.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
    : '';

  notifSvc.broadcast({
    title: `🎉 New Discount: ${discountText}`,
    message: `Use code ${coupon.code} to get ${discountText} on your next booking.${expiry}`,
    type: 'discount',
    actionUrl: '/services',
  }).catch(() => { });
};

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, data: coupons });
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted successfully' });
};

// ── Manual notification (kept for backward-compat; now delegates to notifSvc) ─
exports.sendNotification = async (req, res) => {
  const { title, message, type = 'general', imageUrl, actionUrl, userId } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'title and message are required' });
  }

  let note;
  if (userId) {
    note = await notifSvc.sendToUser(userId, { title, message, type, imageUrl, actionUrl });
  } else {
    note = await notifSvc.broadcast({ title, message, type, imageUrl, actionUrl });
  }

  res.json({ success: true, data: note });
};

exports.getNotifications = async (req, res) => {
  const notes = await Notification.find()
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(100);
  res.json({ success: true, data: notes });
};

exports.getUsers = async (req, res) => {
  const users = await User.find({ role: 'CUSTOMER' }).select('-password').sort('-createdAt');
  res.json({ success: true, data: users });
};

exports.getBookings = async (req, res) => {
  const bookingsSvc = require('../bookings/bookings.service');
  const result = await bookingsSvc.listAllBookings(req.query);
  res.json({ success: true, data: result.bookings, total: result.total });
};

exports.getPayments = async (req, res) => {
  const payments = await Payment.find().populate('user').populate('booking').sort('-createdAt');
  res.json({ success: true, data: payments });
};
