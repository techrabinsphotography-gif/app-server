const User = require('../../models/User');
const Booking = require('../../models/Booking');
const Payment = require('../../models/Payment');
const Settings = require('../../models/Settings');
const Coupon = require('../../models/Coupon');
const Notification = require('../../models/Notification');

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
      appDownloads: settings?.appDownloads || 0
    }
  });
};

exports.getSettings = async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
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

exports.createCoupon = async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.json({ success: true, data: coupon });
};

exports.getCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt');
  res.json({ success: true, data: coupons });
};

exports.deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted successfully' });
};

exports.sendNotification = async (req, res) => {
  const note = await Notification.create(req.body);
  // Example: broadcast via Socket.IO if needed
  res.json({ success: true, data: note });
};

exports.getNotifications = async (req, res) => {
  const notes = await Notification.find().sort('-createdAt');
  res.json({ success: true, data: notes });
};

exports.getUsers = async (req, res) => {
  const users = await User.find({ role: 'CUSTOMER' }).select('-password').sort('-createdAt');
  res.json({ success: true, data: users });
};

exports.getBookings = async (req, res) => {
  const bookings = await Booking.find().populate('user').populate('service').sort('-createdAt');
  res.json({ success: true, data: bookings });
};

exports.getPayments = async (req, res) => {
  const payments = await Payment.find().populate('user').populate('booking').sort('-createdAt');
  res.json({ success: true, data: payments });
};
