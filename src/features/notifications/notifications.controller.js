'use strict';
const Notification = require('../../models/Notification');
const notifSvc = require('../../utils/notificationService');
const { sendSuccess } = require('../../utils/apiResponse');

// ── User: get my notifications (global + personal) ────────────────────────────
exports.getMyNotifications = async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const notifications = await Notification.find({
    $or: [{ user: null }, { user: req.user.id }],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Annotate isRead from the user perspective — for global ones, isRead is
  // stored on the doc but shared; for now treat the stored value as-is.
  const unreadCount = await Notification.countDocuments({
    $or: [{ user: null }, { user: req.user.id }],
    isRead: false,
  });

  sendSuccess(res, { notifications, unreadCount, page: Number(page) });
};

// ── User: mark one as read ────────────────────────────────────────────────────
exports.markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  sendSuccess(res, {}, 'Marked as read');
};

// ── User: mark all as read ────────────────────────────────────────────────────
exports.markAllRead = async (req, res) => {
  await Notification.updateMany(
    { $or: [{ user: null }, { user: req.user.id }], isRead: false },
    { isRead: true }
  );
  sendSuccess(res, {}, 'All notifications marked as read');
};

// ── Admin: send manual notification (broadcast or targeted) ──────────────────
exports.adminSend = async (req, res) => {
  const { title, message, type = 'general', imageUrl, actionUrl, userId } = req.body;

  if (!title?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'title and message are required' });
  }

  let notification;
  if (userId) {
    notification = await notifSvc.sendToUser(userId, { title, message, type, imageUrl, actionUrl });
  } else {
    notification = await notifSvc.broadcast({ title, message, type, imageUrl, actionUrl });
  }

  sendSuccess(res, notification, 'Notification sent', 201);
};

// ── Admin: get all notifications ──────────────────────────────────────────────
exports.adminGetAll = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total] = await Promise.all([
    Notification.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(),
  ]);

  sendSuccess(res, { notifications, total, page: Number(page) });
};

// ── Admin: delete a notification ──────────────────────────────────────────────
exports.adminDelete = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  sendSuccess(res, {}, 'Deleted');
};
