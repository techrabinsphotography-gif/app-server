'use strict';
/**
 * Central notification service.
 *
 * Responsibilities:
 *  1. Persist a Notification document in MongoDB.
 *  2. Broadcast to all connected Socket.IO clients (global) or a specific user room.
 *
 * Usage:
 *   const notifSvc = require('../utils/notificationService');
 *   await notifSvc.broadcast({ title, message, type, imageUrl, actionUrl });
 *   await notifSvc.sendToUser(userId, { title, message, type });
 */

const Notification = require('../models/Notification');

let _io = null; // Socket.IO server instance — injected once at startup

/** Call this once when the Socket.IO server is initialised */
const setIo = (io) => { _io = io; };

// ── Internal helper ──────────────────────────────────────────────────────────
const _emit = (room, notification) => {
  if (_io) {
    _io.to(room).emit('notification:new', notification);
  }
};

/**
 * Broadcast a notification to ALL connected users.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {'general'|'promo'|'service'|'booking'|'discount'} [opts.type='general']
 * @param {string} [opts.imageUrl]
 * @param {string} [opts.actionUrl]  - deep-link or screen path in the app
 * @returns {Promise<Notification>}
 */
const broadcast = async ({ title, message, type = 'general', imageUrl, actionUrl }) => {
  const notification = await Notification.create({
    title,
    message,
    type,
    imageUrl: imageUrl || null,
    actionUrl: actionUrl || null,
    user: null, // null = global
  });

  // Emit to the special global room all authenticated sockets join
  _emit('global_notifications', notification.toObject());
  return notification;
};

/**
 * Send a notification to a single user.
 * @param {string} userId  - MongoDB ObjectId string
 * @param {object} opts
 */
const sendToUser = async (userId, { title, message, type = 'general', imageUrl, actionUrl }) => {
  const notification = await Notification.create({
    title,
    message,
    type,
    imageUrl: imageUrl || null,
    actionUrl: actionUrl || null,
    user: userId,
  });

  // Each user has a personal room: `user_<id>`
  _emit(`user_${userId}`, notification.toObject());
  return notification;
};

module.exports = { setIo, broadcast, sendToUser };
