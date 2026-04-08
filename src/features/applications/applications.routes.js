'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const ctrl = require('./applications.controller');

// PUBLIC: submit application
router.post('/', ctrl.submitApplication);

// ADMIN only
router.use(authenticate, authorize('ADMIN'));
router.get('/', ctrl.listApplications);
router.patch('/:id/approve', ctrl.approveApplication);
router.patch('/:id/reject', ctrl.rejectApplication);
router.delete('/:id', ctrl.deleteApplication);

module.exports = router;
