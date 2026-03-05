const ChatMessage = require('../../models/ChatMessage');

const getUserRooms = async (userId) => {
  // Returns distinct roomIds where this user has participated
  const roomIds = await ChatMessage.distinct('roomId', { senderId: userId });
  return roomIds;
};

const getMessages = async (roomId, { page = 1, limit = 50 }) => {
  const skip = (page - 1) * limit;
  const messages = await ChatMessage.find({ roomId })
    .populate('senderId', 'name avatarUrl')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  return messages.reverse(); // Return in chronological order
};

const sendMessage = async ({ senderId, roomId, content, messageType }) => {
  return ChatMessage.create({ senderId, roomId, content, messageType });
};

const saveMessage = async ({ senderId, roomId, content, messageType }) => {
  const msg = await ChatMessage.create({ senderId, roomId, content, messageType });
  return msg.populate('senderId', 'name avatarUrl');
};

const markAsRead = async (roomId, userId) => {
  await ChatMessage.updateMany(
    { roomId, senderId: { $ne: userId }, isRead: false },
    { isRead: true }
  );
};

module.exports = { getUserRooms, getMessages, sendMessage, saveMessage, markAsRead };
