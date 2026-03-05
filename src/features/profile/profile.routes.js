const { Router } = require('express');
const ctrl = require('./profile.controller');
const { authenticate } = require('../../middleware/authenticate');
const { upload } = require('../../middleware/upload');

const router = Router();

router.get('/', authenticate, ctrl.getProfile);
router.put('/', authenticate, ctrl.updateProfile);
router.put('/password', authenticate, ctrl.changePassword);
router.put('/avatar', authenticate, upload.single('avatar'), ctrl.updateAvatar);
router.delete('/', authenticate, ctrl.deleteAccount);

module.exports = router;
