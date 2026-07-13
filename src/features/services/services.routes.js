const { Router } = require('express');
const ctrl = require('./services.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

// Public routes
router.get('/', ctrl.listServices);
router.get('/trending', ctrl.getTrendingServices);
router.get('/:slug', ctrl.getServiceBySlug);
router.get('/:slug/packages', ctrl.getPackagesBySlug);

// Admin routes (Protected)
router.use(authenticate, authorize('ADMIN'));
router.get('/admin/all', ctrl.listAllServices);
router.post('/', ctrl.createService);
router.put('/:id', ctrl.updateService);
router.patch('/admin/:id/trending', ctrl.toggleTrending);
router.delete('/admin/:id', ctrl.hardDeleteService);
router.delete('/:id', ctrl.deleteService);

module.exports = router;
