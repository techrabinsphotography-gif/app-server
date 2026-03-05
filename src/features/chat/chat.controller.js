const svc = require('./chat.service');
const { sendSuccess } = require('../../utils/apiResponse');

const getUserRooms = async (req, res, next) => {
  try {
    const data = await svc.getUserRooms(req.user.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const getMessages = async (req, res, next) => {
  try {
    const data = await svc.getMessages(req.params.roomId, req.query);
    sendSuccess(res, data);
  } catch (err) { next(err); }
};

const sendMessage = async (req, res, next) => {
  try {
    const data = await svc.sendMessage({
      senderId: req.user.id,
      roomId: req.params.roomId,
      content: req.body.content,
      messageType: req.body.messageType || 'TEXT',
    });
    sendSuccess(res, data, 'Message sent', 201);
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    await svc.markAsRead(req.params.roomId, req.user.id);
    sendSuccess(res, {}, 'Messages marked as read');
  } catch (err) { next(err); }
};

module.exports = { getUserRooms, getMessages, sendMessage, markAsRead };
