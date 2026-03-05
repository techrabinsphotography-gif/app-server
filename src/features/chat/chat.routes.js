const { Router } = require('express');
const ctrl = require('./chat.controller');
const { authenticate } = require('../../middleware/authenticate');

const router = Router();

router.get('/rooms', authenticate, ctrl.getUserRooms);
router.get('/rooms/:roomId/messages', authenticate, ctrl.getMessages);
router.post('/rooms/:roomId/messages', authenticate, ctrl.sendMessage);
router.put('/rooms/:roomId/read', authenticate, ctrl.markAsRead);

module.exports = router;
