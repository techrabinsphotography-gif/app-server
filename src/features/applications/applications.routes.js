'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');
const ctrl = require('./applications.controller');

// PUBLIC: submit application
router.post('/', ctrl.submitApplication);

// PUBLIC resume proxy (token in query param for browser direct access)
router.get('/:id/resume', async (req, res, next) => {
  // Allow token via query param for direct browser access
  if (req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}, ctrl.getResumeSignedUrl);

router.use(authenticate, authorize('ADMIN'));
router.get('/', ctrl.listApplications);
router.get('/:id/resume', ctrl.getResumeSignedUrl);  // streams file through server
router.patch('/:id/approve', ctrl.approveApplication);
router.patch('/:id/reject', ctrl.rejectApplication);
router.delete('/:id', ctrl.deleteApplication);

module.exports = router;
