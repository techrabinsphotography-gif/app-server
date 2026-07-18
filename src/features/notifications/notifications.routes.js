'use strict';
const { Router } = require('express');
const ctrl = require('./notifications.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// ── Authenticated user routes ─────────────────────────────────────────────────
router.use(authenticate);

router.get('/', ctrl.getMyNotifications); // GET  /api/v1/notifications
router.put('/read-all', ctrl.markAllRead);         // PUT  /api/v1/notifications/read-all
router.put('/:id/read', ctrl.markRead);            // PUT  /api/v1/notifications/:id/read

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/', authorize('ADMIN'), ctrl.adminSend);      // POST   /api/v1/notifications
router.get('/admin', authorize('ADMIN'), ctrl.adminGetAll);    // GET    /api/v1/notifications/admin
router.delete('/:id', authorize('ADMIN'), ctrl.adminDelete);    // DELETE /api/v1/notifications/:id

module.exports = router;
