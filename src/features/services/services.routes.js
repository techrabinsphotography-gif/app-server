const { Router } = require('express');
const ctrl = require('./services.controller');
const { authenticate } = require('../../middleware/authenticate');
const { authorize } = require('../../middleware/authorize');

const router = Router();

router.get('/', ctrl.listServices);
router.get('/:slug', ctrl.getServiceBySlug);
router.get('/:slug/packages', ctrl.getPackagesBySlug);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createService);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateService);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteService);

module.exports = router;
