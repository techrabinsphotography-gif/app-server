const { Router } = require('express');
const ctrl = require('./services.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// Public routes
router.get('/', ctrl.listServices);
router.get('/:slug', ctrl.getServiceBySlug);
router.get('/:slug/packages', ctrl.getPackagesBySlug);

// Admin routes (Protected)
router.use(authenticate, authorize('ADMIN'));
router.get('/admin/all', ctrl.listAllServices);  // all services inc. inactive
router.post('/', ctrl.createService);
router.put('/:id', ctrl.updateService);
router.delete('/admin/:id', ctrl.hardDeleteService); // hard delete
router.delete('/:id', ctrl.deleteService);          // soft delete

module.exports = router;
