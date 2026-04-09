'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const ctrl = require('./applications.controller');

// PUBLIC: submit application
router.post('/', ctrl.submitApplication);

// Resume download — token can come from Authorization header OR ?token= query param
router.get('/:id/resume', (req, res, next) => {
  if (req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, authenticate, authorize('ADMIN'), ctrl.getResumeSignedUrl);

// All other routes require ADMIN
router.use(authenticate, authorize('ADMIN'));
router.get('/', ctrl.listApplications);
router.patch('/:id/approve', ctrl.approveApplication);
router.patch('/:id/reject', ctrl.rejectApplication);
router.delete('/:id', ctrl.deleteApplication);

module.exports = router;
